import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  transaction_type: string;
}

export const MonthlyAnalytics = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));

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

  const getAvailableMonths = () => {
    const months = new Set<string>();
    transactions.forEach(transaction => {
      months.add(transaction.date.substring(0, 7));
    });
    return Array.from(months).sort().reverse();
  };

  const getMonthlyData = () => {
    const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
    
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
      income,
      expenses,
      net: income - expenses,
      categoryBreakdown: categoryData
    };
  };

  const getDailyData = () => {
    const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
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
    return <div className="text-center p-8">Loading monthly analytics...</div>;
  }

  const availableMonths = getAvailableMonths();
  const monthlyData = getMonthlyData();
  const dailyData = getDailyData();

  return (
    <div className="space-y-6">
      {/* Header with Month Selection */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl">Monthly Analytics</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Select Month:</span>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-40">
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
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Income</span>
              </div>
              <p className="text-2xl font-bold text-green-800">${monthlyData.income.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-red-700">Expenses</span>
              </div>
              <p className="text-2xl font-bold text-red-800">${monthlyData.expenses.toFixed(2)}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Net</span>
              </div>
              <p className={`text-2xl font-bold ${monthlyData.net >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                ${monthlyData.net.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories */}
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
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No expense data for this month
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Income vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`]} />
                  <Bar dataKey="income" fill="#00C49F" name="Income" />
                  <Bar dataKey="expenses" fill="#FF8042" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No transaction data for this month
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 