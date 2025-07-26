import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, Target } from "lucide-react";

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
}

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

interface SavingsGoalsProps {
  onDataChanged?: () => void;
}

export const SavingsGoals = ({ onDataChanged }: SavingsGoalsProps) => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [paycheckSplits, setPaycheckSplits] = useState<PaycheckSplit[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showPaycheckForm, setShowPaycheckForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    current_amount: "",
    target_date: ""
  });
  const [paycheckFormData, setPaycheckFormData] = useState({
    name: "",
    paycheck_amount: "",
    input_type: "percentage", // "percentage" or "dollar"
    investing_percentage: "",
    spending_percentage: "",
    savings_percentage: "",
    debt_percentage: "",
    investing_amount: "",
    spending_amount: "",
    savings_amount: "",
    debt_amount: ""
  });

  useEffect(() => {
    fetchGoals();
    fetchPaycheckSplits();
  }, []);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("*")
        .order("target_date", { ascending: true });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error("Error fetching savings goals:", error);
    }
  };

  const fetchPaycheckSplits = async () => {
    try {
      const { data, error } = await supabase
        .from("paycheck_splits")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPaycheckSplits(data || []);
    } catch (error) {
      console.error("Error fetching paycheck splits:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("savings_goals")
        .insert([{
          name: formData.name,
          target_amount: parseFloat(formData.target_amount),
          current_amount: parseFloat(formData.current_amount || "0"),
          target_date: formData.target_date || null
        }]);

      if (error) throw error;

      toast.success("Savings goal added successfully!");
      setFormData({
        name: "",
        target_amount: "",
        current_amount: "",
        target_date: ""
      });
      setShowForm(false);
      fetchGoals();
      onDataChanged?.();
    } catch (error) {
      toast.error("Failed to add savings goal");
      console.error(error);
    }
  };

  const handlePaycheckSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let investingPercentage, spendingPercentage, savingsPercentage, debtPercentage;
    
    if (paycheckFormData.input_type === "percentage") {
      // Calculate percentages from dollar amounts
      const totalAmount = parseFloat(paycheckFormData.paycheck_amount);
      const investingAmount = parseFloat(paycheckFormData.investing_amount || "0");
      const spendingAmount = parseFloat(paycheckFormData.spending_amount || "0");
      const savingsAmount = parseFloat(paycheckFormData.savings_amount || "0");
      const debtAmount = parseFloat(paycheckFormData.debt_amount || "0");
      
      const totalDollarAmount = investingAmount + spendingAmount + savingsAmount + debtAmount;
      
      if (Math.abs(totalDollarAmount - totalAmount) > 0.01) {
        toast.error("Dollar amounts must add up to the total paycheck amount");
        return;
      }
      
      investingPercentage = (investingAmount / totalAmount) * 100;
      spendingPercentage = (spendingAmount / totalAmount) * 100;
      savingsPercentage = (savingsAmount / totalAmount) * 100;
      debtPercentage = (debtAmount / totalAmount) * 100;
    } else {
      // Use percentages directly
      investingPercentage = parseFloat(paycheckFormData.investing_percentage);
      spendingPercentage = parseFloat(paycheckFormData.spending_percentage);
      savingsPercentage = parseFloat(paycheckFormData.savings_percentage);
      debtPercentage = parseFloat(paycheckFormData.debt_percentage || "0");
      
      const totalPercentage = investingPercentage + spendingPercentage + savingsPercentage + debtPercentage;
      
      if (Math.abs(totalPercentage - 100) > 0.01) {
        toast.error("Percentages must add up to 100%");
        return;
      }
    }

    try {
      const { error } = await supabase
        .from("paycheck_splits")
        .insert([{
          name: paycheckFormData.name,
          paycheck_amount: parseFloat(paycheckFormData.paycheck_amount),
          investing_percentage: investingPercentage,
          spending_percentage: spendingPercentage,
          savings_percentage: savingsPercentage,
          debt_percentage: debtPercentage
        }]);

      if (error) throw error;

      toast.success("Paycheck split added successfully!");
      setPaycheckFormData({
        name: "",
        paycheck_amount: "",
        input_type: "percentage",
        investing_percentage: "",
        spending_percentage: "",
        savings_percentage: "",
        debt_percentage: "",
        investing_amount: "",
        spending_amount: "",
        savings_amount: "",
        debt_amount: ""
      });
      setShowPaycheckForm(false);
      fetchPaycheckSplits();
      onDataChanged?.();
    } catch (error) {
      toast.error("Failed to add paycheck split");
      console.error(error);
    }
  };

  const deleteGoal = async (id: string) => {
    try {
      const { error } = await supabase
        .from("savings_goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Savings goal deleted successfully!");
      fetchGoals();
      onDataChanged?.();
    } catch (error) {
      toast.error("Failed to delete savings goal");
      console.error(error);
    }
  };

  const updateAmount = async (id: string, newAmount: number) => {
    try {
      const { error } = await supabase
        .from("savings_goals")
        .update({ current_amount: newAmount })
        .eq("id", id);

      if (error) throw error;
      toast.success("Amount updated!");
      fetchGoals();
    } catch (error) {
      toast.error("Failed to update amount");
      console.error(error);
    }
  };

  const totalSavings = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const totalTargets = goals.reduce((sum, goal) => sum + goal.target_amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Savings Goals</h2>
          <p className="text-muted-foreground">
            Total Saved: ${totalSavings.toFixed(2)} | Total Goals: ${totalTargets.toFixed(2)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowPaycheckForm(!showPaycheckForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Paycheck Split
          </Button>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Goal
          </Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Savings Goal</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="goal-name">Goal Name</Label>
                  <Input
                    id="goal-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Emergency Fund, Vacation, etc."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="target-amount">Target Amount</Label>
                  <Input
                    id="target-amount"
                    type="number"
                    step="0.01"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current-amount">Current Amount</Label>
                  <Input
                    id="current-amount"
                    type="number"
                    step="0.01"
                    value={formData.current_amount}
                    onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="target-date">Target Date</Label>
                  <Input
                    id="target-date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add Goal</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showPaycheckForm && (
        <div className="wealthsimple-card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 wealthsimple-pink rounded-xl flex items-center justify-center border border-pink-200">
              <span className="text-gray-700 text-lg">💰</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Paycheck Split</h2>
              <p className="text-gray-600">Split your paycheck by percentage</p>
            </div>
          </div>
          <form onSubmit={handlePaycheckSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="split-name">Split Name</Label>
                <Input
                  id="split-name"
                  value={paycheckFormData.name}
                  onChange={(e) => setPaycheckFormData({ ...paycheckFormData, name: e.target.value })}
                  placeholder="Monthly Paycheck, Bonus, etc."
                  required
                />
              </div>
              <div>
                <Label htmlFor="paycheck-amount">Paycheck Amount</Label>
                <Input
                  id="paycheck-amount"
                  type="number"
                  step="0.01"
                  value={paycheckFormData.paycheck_amount}
                  onChange={(e) => setPaycheckFormData({ ...paycheckFormData, paycheck_amount: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label>Input Type</Label>
              <div className="flex gap-4 mt-2">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="input_type"
                    value="percentage"
                    checked={paycheckFormData.input_type === "percentage"}
                    onChange={(e) => setPaycheckFormData({ ...paycheckFormData, input_type: e.target.value })}
                  />
                  <span>Enter Percentages</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="input_type"
                    value="dollar"
                    checked={paycheckFormData.input_type === "dollar"}
                    onChange={(e) => setPaycheckFormData({ ...paycheckFormData, input_type: e.target.value })}
                  />
                  <span>Enter Dollar Amounts</span>
                </label>
              </div>
            </div>
            {paycheckFormData.input_type === "percentage" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="investing-percentage">Investing %</Label>
                    <Input
                      id="investing-percentage"
                      type="number"
                      step="0.01"
                      value={paycheckFormData.investing_percentage}
                      onChange={(e) => setPaycheckFormData({ ...paycheckFormData, investing_percentage: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="spending-percentage">Spending %</Label>
                    <Input
                      id="spending-percentage"
                      type="number"
                      step="0.01"
                      value={paycheckFormData.spending_percentage}
                      onChange={(e) => setPaycheckFormData({ ...paycheckFormData, spending_percentage: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="savings-percentage">Savings %</Label>
                    <Input
                      id="savings-percentage"
                      type="number"
                      step="0.01"
                      value={paycheckFormData.savings_percentage}
                      onChange={(e) => setPaycheckFormData({ ...paycheckFormData, savings_percentage: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="debt-percentage">Debt %</Label>
                    <Input
                      id="debt-percentage"
                      type="number"
                      step="0.01"
                      value={paycheckFormData.debt_percentage}
                      onChange={(e) => setPaycheckFormData({ ...paycheckFormData, debt_percentage: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="investing-amount">Investing Amount</Label>
                    <Input
                      id="investing-amount"
                      type="number"
                      step="0.01"
                      value={paycheckFormData.investing_amount}
                      onChange={(e) => setPaycheckFormData({ ...paycheckFormData, investing_amount: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="spending-amount">Spending Amount</Label>
                    <Input
                      id="spending-amount"
                      type="number"
                      step="0.01"
                      value={paycheckFormData.spending_amount}
                      onChange={(e) => setPaycheckFormData({ ...paycheckFormData, spending_amount: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="savings-amount">Savings Amount</Label>
                    <Input
                      id="savings-amount"
                      type="number"
                      step="0.01"
                      value={paycheckFormData.savings_amount}
                      onChange={(e) => setPaycheckFormData({ ...paycheckFormData, savings_amount: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="debt-amount">Debt Amount</Label>
                    <Input
                      id="debt-amount"
                      type="number"
                      step="0.01"
                      value={paycheckFormData.debt_amount}
                      onChange={(e) => setPaycheckFormData({ ...paycheckFormData, debt_amount: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>
              </>
            )}
            <div className="flex gap-2">
              <Button type="submit" className="wealthsimple-button">Add Split</Button>
              <Button type="button" onClick={() => setShowPaycheckForm(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Paycheck Splits Display */}
      {paycheckSplits.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Paycheck Splits</h3>
          <div className="grid gap-4">
            {paycheckSplits.map((split) => (
              <div key={split.id} className="wealthsimple-card p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{split.name}</h4>
                    <p className="text-sm text-gray-600">${split.paycheck_amount.toFixed(2)} per paycheck</p>
                  </div>
                  <Button
                    onClick={() => {
                      // Add delete functionality here
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      ${(split.paycheck_amount * split.investing_percentage / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Investing ({split.investing_percentage}%)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      ${(split.paycheck_amount * split.spending_percentage / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Spending ({split.spending_percentage}%)</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      ${(split.paycheck_amount * split.savings_percentage / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Savings ({split.savings_percentage}%)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      ${(split.paycheck_amount * (split.debt_percentage || 0) / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Debt ({split.debt_percentage || 0}%)</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {goals.map((goal) => {
          const progress = (goal.current_amount / goal.target_amount) * 100;
          const isCompleted = progress >= 100;
          
          return (
            <Card key={goal.id} className={isCompleted ? "border-green-500" : ""}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <Target className={`w-5 h-5 ${isCompleted ? "text-green-500" : "text-muted-foreground"}`} />
                    <div>
                      <h3 className="font-semibold text-lg">{goal.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {goal.target_date && `Target: ${new Date(goal.target_date).toLocaleDateString()}`}
                        {isCompleted && " • 🎉 Goal Reached!"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteGoal(goal.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>${goal.current_amount.toFixed(2)} / ${goal.target_amount.toFixed(2)} ({progress.toFixed(1)}%)</span>
                  </div>
                  <Progress 
                    value={Math.min(progress, 100)} 
                    className="h-2"
                  />
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Remaining</p>
                    <p className="font-semibold">
                      ${Math.max(0, goal.target_amount - goal.current_amount).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Add amount"
                      className="w-32"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const addAmount = parseFloat((e.target as HTMLInputElement).value);
                          if (!isNaN(addAmount)) {
                            updateAmount(goal.id, goal.current_amount + addAmount);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        const addAmount = parseFloat(input.value);
                        if (!isNaN(addAmount)) {
                          updateAmount(goal.id, goal.current_amount + addAmount);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};