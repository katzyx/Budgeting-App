import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  transaction_type: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
  transactions: Transaction[];
  categoryBreakdown: { name: string; value: number }[];
}

interface MonthlyTransactionsProps {
  onDataChanged?: () => void;
}

export const MonthlyTransactions = ({ onDataChanged }: MonthlyTransactionsProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Transaction deleted successfully!");
      fetchTransactions();
      onDataChanged?.();
    } catch (error) {
      toast.error("Failed to delete transaction");
      console.error(error);
    }
  };

  const getAvailableMonths = () => {
    const months = new Set<string>();
    transactions.forEach(transaction => {
      months.add(transaction.date.substring(0, 7));
    });
    return Array.from(months).sort().reverse();
  };

  const getMonthlyData = (month: string): MonthlyData => {
    const monthTransactions = transactions.filter(t => t.date.startsWith(month));
    
    const income = monthTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = monthTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const categoryBreakdown = monthTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((acc, transaction) => {
        acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);

    const categoryData = Object.entries(categoryBreakdown).map(([category, amount]) => ({
      name: category,
      value: amount
    }));

    return {
      month,
      income,
      expenses,
      net: income - expenses,
      transactions: monthTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      categoryBreakdown: categoryData
    };
  };

  const getDailyData = (month: string) => {
    const monthTransactions = transactions.filter(t => t.date.startsWith(month));
    const dailyTotals = monthTransactions.reduce((acc, transaction) => {
      const day = transaction.date;
      if (!acc[day]) {
        acc[day] = { income: 0, expenses: 0 };
      }
      if (transaction.transaction_type === 'income') {
        acc[day].income += transaction.amount;
      } else {
        acc[day].expenses += transaction.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expenses: number }>);

    return Object.entries(dailyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, data]) => ({
        day: format(parseISO(day), "MMM dd"),
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses
      }));
  };

  if (loading) {
    return <div className="text-center p-8">Loading monthly data...</div>;
  }

  const availableMonths = getAvailableMonths();
  const monthlyData = getMonthlyData(selectedMonth);
  const dailyData = getDailyData(selectedMonth);

  return (
    <div className="space-y-6">
      {/* Month Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((month) => (
                  <SelectItem key={month} value={month}>
                    {format(parseISO(month + "-01"), "MMMM yyyy")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Badge variant="outline">
              {monthlyData.transactions.length} transactions
            </Badge>
          </div>

          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Income</div>
                <div className="text-2xl font-bold text-green-600">
                  ${monthlyData.income.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Expenses</div>
                <div className="text-2xl font-bold text-red-600">
                  ${monthlyData.expenses.toFixed(2)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-muted-foreground">Net</div>
                <div className={`text-2xl font-bold ${monthlyData.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${monthlyData.net.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Bar dataKey="income" fill="#00C49F" name="Income" />
                <Bar dataKey="expenses" fill="#FF8042" name="Expenses" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={monthlyData.categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {monthlyData.categoryBreakdown.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No expense data for this month
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Net Worth Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Net Worth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Line type="monotone" dataKey="net" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions for {format(parseISO(selectedMonth + "-01"), "MMMM yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          {monthlyData.transactions.length > 0 ? (
            <div className="space-y-2">
              {monthlyData.transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{transaction.description || transaction.category}</div>
                    <div className="text-sm text-muted-foreground">
                      {format(parseISO(transaction.date), "MMM dd, yyyy")} • {transaction.category}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={transaction.transaction_type === 'income' ? 'default' : 'secondary'}>
                      {transaction.transaction_type}
                    </Badge>
                    <span className={`font-bold ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      ${transaction.amount.toFixed(2)}
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteTransaction(transaction.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions for this month
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 