import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart as PieChartIcon, TrendingUpIcon } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  transaction_type: string;
}

export const ChartsCarousel = ({ refreshTrigger }: { refreshTrigger: number }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, [refreshTrigger]);

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
      const month = transaction.date.substring(0, 7);
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

  const charts = [
    {
      id: "stats",
      title: "Financial Overview",
      icon: DollarSign,
      content: (
        <div className="grid grid-cols-1 gap-4">
          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700">Total Income</span>
            </div>
            <p className="text-2xl font-bold text-green-800">${stats.totalIncome.toFixed(2)}</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <span className="text-sm font-medium text-red-700">Total Expenses</span>
            </div>
            <p className="text-2xl font-bold text-red-800">${stats.totalExpenses.toFixed(2)}</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">Net Amount</span>
            </div>
            <p className={`text-2xl font-bold ${stats.netAmount >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
              ${stats.netAmount.toFixed(2)}
            </p>
          </div>
        </div>
      )
    },
    {
      id: "category",
      title: "Spending by Category", 
      icon: PieChartIcon,
      content: (
        <ResponsiveContainer width="100%" height={280}>
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
      )
    },
    {
      id: "monthly",
      title: "Monthly Income vs Expenses",
      icon: BarChart3,
      content: (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => `$${value}`} />
            <Bar dataKey="income" fill="#00C49F" />
            <Bar dataKey="expenses" fill="#FF8042" />
          </BarChart>
        </ResponsiveContainer>
      )
    },
    {
      id: "trend",
      title: "Net Worth Trend",
      icon: TrendingUpIcon,
      content: (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => `$${value}`} />
            <Line type="monotone" dataKey="net" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      )
    }
  ];

  return (
    <div className="w-full">
      <Carousel className="w-full max-w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Financial Charts</h3>
          <div className="flex gap-2">
            <CarouselPrevious className="relative translate-y-0 translate-x-0" />
            <CarouselNext className="relative translate-y-0 translate-x-0" />
          </div>
        </div>
        <CarouselContent>
          {charts.map((chart) => (
            <CarouselItem key={chart.id}>
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <chart.icon className="w-5 h-5 text-primary" />
                    {chart.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {chart.content}
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
};