import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Target, TrendingUp, TrendingDown, DollarSign, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TransactionForm } from "./TransactionForm";

const GOAL_TYPES = ["debt", "savings", "investment"];

export const FinancialHealth = () => {
  const [goals, setGoals] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState<{ [key: string]: boolean }>({});
  const [selectedGoal, setSelectedGoal] = useState<any | null>(null);
  const [addType, setAddType] = useState<string>("");

  useEffect(() => {
    fetchAllGoals();
  }, []);

  const fetchAllGoals = async () => {
    const [debtsRes, savingsRes, investmentsRes] = await Promise.all([
      supabase.from("debts").select("id, name, total_amount, current_balance"),
      supabase.from("savings_goals").select("id, name, target_amount, current_amount"),
      supabase.from("investments").select("id, name, amount, current_value")
    ]);
    setGoals([
      ...(debtsRes.data || []).map((d: any) => ({
        ...d,
        type: "debt",
        title: d.name,
        targetAmount: d.total_amount,
        currentAmount: d.total_amount - d.current_balance,
        transactions: [], // TODO: fetch linked transactions
      })),
      ...(savingsRes.data || []).map((g: any) => ({
        ...g,
        type: "savings",
        title: g.name,
        targetAmount: g.target_amount,
        currentAmount: g.current_amount,
        transactions: [], // TODO: fetch linked transactions
      })),
      ...(investmentsRes.data || []).map((i: any) => ({
        ...i,
        type: "investment",
        title: i.name,
        targetAmount: i.amount,
        currentAmount: i.current_value ?? i.amount,
        transactions: [], // TODO: fetch linked transactions
      }))
    ]);
  };

  const groupedGoals = GOAL_TYPES.map(type => ({
    type,
    goals: goals.filter(g => g.type === type)
  }));

  const handleShowAdd = (type: string, goal?: any) => {
    setAddType(type);
    setSelectedGoal(goal || null);
    setShowAddForm({ ...showAddForm, [type]: true });
  };

  const handleCloseAdd = (type: string) => {
    setShowAddForm({ ...showAddForm, [type]: false });
    setSelectedGoal(null);
  };

  return (
    <div className="space-y-8">
      {groupedGoals.map(group => (
        <div key={group.type} className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold capitalize">{group.type} Goals</h2>
            <Button onClick={() => handleShowAdd(group.type)}>
              <Plus className="w-4 h-4 mr-2" />
              Add {group.type.charAt(0).toUpperCase() + group.type.slice(1)}
            </Button>
          </div>
          {showAddForm[group.type] && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Add {group.type.charAt(0).toUpperCase() + group.type.slice(1)} Goal</CardTitle>
              </CardHeader>
              <CardContent>
                <TransactionForm
                  prefillType={group.type === "debt" ? "Debt Payment" : group.type === "savings" ? "Savings" : "Investment"}
                  prefillGoalId={selectedGoal?.id || ""}
                  onTransactionAdded={() => handleCloseAdd(group.type)}
                />
              </CardContent>
            </Card>
          )}
          <div className="grid gap-4">
            {group.goals.map(goal => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              return (
                <Card key={goal.id}>
                  <CardHeader>
                    <CardTitle>{goal.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-2">
                      <span>Progress</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2 mb-2" />
                    <div className="flex justify-between text-sm mb-2">
                      <span>${goal.currentAmount.toFixed(2)} / ${goal.targetAmount.toFixed(2)}</span>
                      <Button size="sm" onClick={() => handleShowAdd(group.type, goal)}>
                        Add Transaction
                      </Button>
                    </div>
                    <div className="mt-4">
                      <h4 className="font-semibold text-sm mb-2">Recent Transactions</h4>
                      <div className="space-y-1">
                        {goal.transactions?.slice(0, 5).map((tx: any) => (
                          <div key={tx.id} className="flex justify-between text-xs">
                            <span>{new Date(tx.date).toLocaleDateString()}</span>
                            <span>${tx.amount.toFixed(2)}</span>
                          </div>
                        )) || <span className="text-muted-foreground">No transactions</span>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
