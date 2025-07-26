import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface PaycheckSplit {
  id: string;
  name: string;
  paycheck_amount: number;
  investing_percentage: number;
  spending_percentage: number;
  savings_percentage: number;
  debt_percentage: number;
  created_at: string;
}

interface PaycheckSplitGoalsProps {
  onDataChanged?: () => void;
}

export const PaycheckSplitGoals = ({ onDataChanged }: PaycheckSplitGoalsProps) => {
  const [paycheckSplits, setPaycheckSplits] = useState<PaycheckSplit[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [splitsResult, transactionsResult] = await Promise.all([
        supabase.from("paycheck_splits").select("*").order("created_at", { ascending: false }),
        supabase.from("transactions").select("*").order("date", { ascending: false })
      ]);

      if (splitsResult.error) throw splitsResult.error;
      if (transactionsResult.error) throw transactionsResult.error;

      setPaycheckSplits(splitsResult.data || []);
      setTransactions(transactionsResult.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentMonthData = () => {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const monthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));
    
    const totalIncome = monthTransactions
      .filter(t => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpenses = monthTransactions
      .filter(t => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return { totalIncome, totalExpenses };
  };

  const calculateGoalStatus = (split: PaycheckSplit) => {
    const { totalIncome } = getCurrentMonthData();
    const expectedInvesting = (split.paycheck_amount * split.investing_percentage / 100);
    const expectedSpending = (split.paycheck_amount * split.spending_percentage / 100);
    const expectedSavings = (split.paycheck_amount * split.savings_percentage / 100);
    const expectedDebt = (split.paycheck_amount * (split.debt_percentage || 0) / 100);

    // For now, we'll use a simple comparison
    // In a real app, you'd want to track actual spending vs expected
    const actualIncome = totalIncome;
    const incomeRatio = actualIncome / split.paycheck_amount;

    return {
      investing: { expected: expectedInvesting, actual: expectedInvesting * incomeRatio },
      spending: { expected: expectedSpending, actual: expectedSpending * incomeRatio },
      savings: { expected: expectedSavings, actual: expectedSavings * incomeRatio },
      debt: { expected: expectedDebt, actual: expectedDebt * incomeRatio },
      incomeRatio
    };
  };

  if (loading) {
    return <div className="text-center p-8">Loading paycheck goals...</div>;
  }

  if (paycheckSplits.length === 0) {
    return null;
  }

  return (
    <div className="wealthsimple-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 wealthsimple-pink rounded-xl flex items-center justify-center border border-pink-200">
          <span className="text-gray-700 text-lg">🎯</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Paycheck Split Goals</h2>
          <p className="text-gray-600">Track your financial allocation goals</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {paycheckSplits.map((split) => {
          const status = calculateGoalStatus(split);
          const { totalIncome } = getCurrentMonthData();
          
          return (
            <div key={split.id} className="border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{split.name}</h3>
                  <p className="text-sm text-gray-600">
                    Expected: ${split.paycheck_amount.toFixed(2)} | Actual: ${totalIncome.toFixed(2)}
                  </p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {status.incomeRatio >= 1 ? 'On Track' : 'Below Target'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {status.investing.actual >= status.investing.expected ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">Investing</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ${status.investing.actual.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">
                    Goal: ${status.investing.expected.toFixed(2)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {status.spending.actual <= status.spending.expected ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm font-medium">Spending</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ${status.spending.actual.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">
                    Goal: ${status.spending.expected.toFixed(2)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {status.savings.actual >= status.savings.expected ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">Savings</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ${status.savings.actual.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">
                    Goal: ${status.savings.expected.toFixed(2)}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {status.debt.actual >= status.debt.expected ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">Debt</span>
                  </div>
                  <div className="text-lg font-bold text-gray-900">
                    ${status.debt.actual.toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600">
                    Goal: ${status.debt.expected.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}; 