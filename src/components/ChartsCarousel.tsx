import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { TrendingUp, TrendingDown, DollarSign, BarChart3, PieChart as PieChartIcon, TrendingUpIcon } from "lucide-react";

const COLORS = ['hsl(344 100% 88%)', 'hsl(200 50% 88%)', 'hsl(160 30% 88%)', 'hsl(60 85% 75%)', 'hsl(142 76% 36%)', 'hsl(0 84% 60%)', 'hsl(217 91% 60%)', 'hsl(38 92% 50%)'];

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
          <div className="text-center p-4 bg-gradient-to-r from-accent/20 to-accent/30 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-success" />
              <span className="text-xs sm:text-sm font-medium text-success truncate">Total Income</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-success break-all">${stats.totalIncome.toFixed(2)}</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-destructive/20 to-destructive/30 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              <span className="text-xs sm:text-sm font-medium text-destructive truncate">Total Expenses</span>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-destructive break-all">${stats.totalExpenses.toFixed(2)}</p>
          </div>
          <div className="text-center p-4 bg-gradient-to-r from-primary/20 to-primary/30 rounded-lg">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-xs sm:text-sm font-medium text-primary truncate">Net Amount</span>
            </div>
            <p className={`text-lg sm:text-xl md:text-2xl font-bold break-all ${stats.netAmount >= 0 ? 'text-primary' : 'text-destructive'}`}>
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
              label={({ name, percent }) => `${name.length > 8 ? name.substring(0, 8) + '...' : name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={window.innerWidth < 640 ? 60 : 80}
              fill="hsl(var(--primary))"
              dataKey="value"
            >
              {categoryData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`$${value}`, 'Amount']}
              contentStyle={{ fontSize: '12px' }}
            />
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
          <BarChart data={monthlyData} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 10 }} 
              interval="preserveStartEnd"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 10 }} 
              width={60}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value) => `$${value}`}
              contentStyle={{ fontSize: '12px' }}
            />
            <Bar dataKey="income" fill="hsl(var(--success))" />
            <Bar dataKey="expenses" fill="hsl(var(--destructive))" />
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
          <LineChart data={monthlyData} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 10 }} 
              interval="preserveStartEnd"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              tick={{ fontSize: 10 }} 
              width={60}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              formatter={(value) => `$${value}`}
              contentStyle={{ fontSize: '12px' }}
            />
            <Line 
              type="monotone" 
              dataKey="net" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )
    }
  ];

  return (
    <div className="w-full">
      <Carousel className="w-full max-w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-foreground truncate">Financial Charts</h3>
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
                  <CardTitle className="flex items-center gap-2 text-sm sm:text-base truncate">
                    <chart.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                    <span className="truncate">{chart.title}</span>
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