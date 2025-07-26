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

interface SavingsGoalsProps {
  onDataChanged?: () => void;
}

export const SavingsGoals = ({ onDataChanged }: SavingsGoalsProps) => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    target_amount: "",
    current_amount: "",
    target_date: ""
  });

  useEffect(() => {
    fetchGoals();
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
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </Button>
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