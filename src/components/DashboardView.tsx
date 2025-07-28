import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, subYears, subMonths } from "date-fns";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";



interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  transaction_type: string;
}

type TimeRange = 'all' | '1year' | 'monthly';

export const DashboardView = ({ refreshTrigger }: { refreshTrigger: number }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));

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

  const getFilteredTransactions = () => {
    const now = new Date();
    let filtered = transactions;

    switch (timeRange) {
      case '1year':
        const oneYearAgo = subYears(now, 1);
        filtered = transactions.filter(t => new Date(t.date) >= oneYearAgo);
        break;
      case 'monthly':
        filtered = transactions.filter(t => t.date.startsWith(selectedMonth));
        break;
      default:
        break;
    }

    return filtered;
  };

  const getNetWorthData = () => {
    const filtered = getFilteredTransactions();
    const monthlyTotals = filtered.reduce((acc, transaction) => {
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

    let runningTotal = 0;
    return Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => {
        const net = data.income - data.expenses;
        runningTotal += net;
        return {
          month: format(parseISO(month + "-01"), "MMM yyyy"),
          net: runningTotal,
          monthlyNet: net
        };
      });
  };



  const getTotalStats = () => {
    const filtered = getFilteredTransactions();
    const totalIncome = filtered
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = filtered
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      netWorth: totalIncome - totalExpenses
    };
  };

  const getAvailableMonths = () => {
    const months = new Set<string>();
    transactions.forEach(transaction => {
      months.add(transaction.date.substring(0, 7));
    });
    return Array.from(months).sort().reverse();
  };

  if (loading) {
    return <div className="text-center p-8">Loading dashboard...</div>;
  }

  const netWorthData = getNetWorthData();
  const stats = getTotalStats();
  const availableMonths = getAvailableMonths();

  return (
    <div className="space-y-6">
      {/* Net Worth Overview */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-xl">Net Worth Overview</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex gap-1">
                <Button
                  variant={timeRange === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('all')}
                >
                  All Time
                </Button>
                <Button
                  variant={timeRange === '1year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('1year')}
                >
                  1 Year
                </Button>
                <Button
                  variant={timeRange === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('monthly')}
                >
                  Monthly
                </Button>
              </div>
              {timeRange === 'monthly' && (
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map((month) => (
                      <SelectItem key={month} value={month}>
                        {format(parseISO(month + "-01"), "MMM yyyy")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                <span className="text-sm font-medium text-blue-700">Net Worth</span>
              </div>
              <p className={`text-2xl font-bold ${stats.netWorth >= 0 ? 'text-blue-800' : 'text-red-800'}`}>
                ${stats.netWorth.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Net Worth Trend Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={netWorthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Net Worth']} />
                <Line type="monotone" dataKey="net" stroke="#0088FE" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>


    </div>
  );
};