import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  transaction_type: string;
}

export const SpendingCharts = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

  const getCategoryData = () => {
    const expenses = transactions.filter(t => t.transaction_type === 'expense');
    const categoryTotals = expenses.reduce((acc, transaction) => {
      acc[transaction.category] = (acc[transaction.category] || 0) + transaction.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([category, amount]) => ({
      name: category,
      value: amount
    }));
  };

  const getMonthlyData = () => {
    const monthlyTotals = transactions.reduce((acc, transaction) => {
      const month = transaction.date.substring(0, 7); // YYYY-MM format
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0 };
      }
      if (transaction.transaction_type === 'income') {
        acc[month].income += transaction.amount;
      } else {
        acc[month].expenses += transaction.amount;
      }
      return acc;
    }, {} as Record<string, { income: number; expenses: number }>);

    return Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: format(parseISO(month + "-01"), "MMM yyyy"),
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses
      }));
  };

  const getTotalStats = () => {
    const totalIncome = transactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netAmount: totalIncome - totalExpenses
    };
  };

  if (loading) {
    return <div className="text-center p-8">Loading charts...</div>;
  }

  const categoryData = getCategoryData();
  const monthlyData = getMonthlyData();
  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">${stats.totalIncome.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">${stats.totalExpenses.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Net Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${stats.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${stats.netAmount.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value}`} />
                <Bar dataKey="income" fill="#00C49F" />
                <Bar dataKey="expenses" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Net Worth Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Line type="monotone" dataKey="net" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};