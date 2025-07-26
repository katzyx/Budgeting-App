import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

interface Debt {
  id: string;
  name: string;
  total_amount: number;
  current_balance: number;
  interest_rate: number;
  minimum_payment: number;
  due_date: string;
}

export const DebtTracker = () => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    total_amount: "",
    current_balance: "",
    interest_rate: "",
    minimum_payment: "",
    due_date: ""
  });

  useEffect(() => {
    fetchDebts();
  }, []);

  const fetchDebts = async () => {
    try {
      const { data, error } = await supabase
        .from("debts")
        .select("*")
        .order("due_date", { ascending: true });

      if (error) throw error;
      setDebts(data || []);
    } catch (error) {
      console.error("Error fetching debts:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("debts")
        .insert([{
          name: formData.name,
          total_amount: parseFloat(formData.total_amount),
          current_balance: parseFloat(formData.current_balance),
          interest_rate: parseFloat(formData.interest_rate || "0"),
          minimum_payment: parseFloat(formData.minimum_payment || "0"),
          due_date: formData.due_date || null
        }]);

      if (error) throw error;

      toast.success("Debt added successfully!");
      setFormData({
        name: "",
        total_amount: "",
        current_balance: "",
        interest_rate: "",
        minimum_payment: "",
        due_date: ""
      });
      setShowForm(false);
      fetchDebts();
    } catch (error) {
      toast.error("Failed to add debt");
      console.error(error);
    }
  };

  const deleteDebt = async (id: string) => {
    try {
      const { error } = await supabase
        .from("debts")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Debt deleted successfully!");
      fetchDebts();
    } catch (error) {
      toast.error("Failed to delete debt");
      console.error(error);
    }
  };

  const updateBalance = async (id: string, newBalance: number) => {
    try {
      const { error } = await supabase
        .from("debts")
        .update({ current_balance: newBalance })
        .eq("id", id);

      if (error) throw error;
      toast.success("Balance updated!");
      fetchDebts();
    } catch (error) {
      toast.error("Failed to update balance");
      console.error(error);
    }
  };

  const totalDebt = debts.reduce((sum, debt) => sum + debt.current_balance, 0);
  const totalOriginal = debts.reduce((sum, debt) => sum + debt.total_amount, 0);
  const totalPaid = totalOriginal - totalDebt;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Debt Tracker</h2>
          <p className="text-muted-foreground">
            Total Debt: ${totalDebt.toFixed(2)} | Total Paid: ${totalPaid.toFixed(2)}
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Debt
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Debt</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="debt-name">Debt Name</Label>
                  <Input
                    id="debt-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Credit Card, Student Loan, etc."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="total-amount">Original Amount</Label>
                  <Input
                    id="total-amount"
                    type="number"
                    step="0.01"
                    value={formData.total_amount}
                    onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="current-balance">Current Balance</Label>
                  <Input
                    id="current-balance"
                    type="number"
                    step="0.01"
                    value={formData.current_balance}
                    onChange={(e) => setFormData({ ...formData, current_balance: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                  <Input
                    id="interest-rate"
                    type="number"
                    step="0.01"
                    value={formData.interest_rate}
                    onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minimum-payment">Minimum Payment</Label>
                  <Input
                    id="minimum-payment"
                    type="number"
                    step="0.01"
                    value={formData.minimum_payment}
                    onChange={(e) => setFormData({ ...formData, minimum_payment: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="due-date">Due Date</Label>
                  <Input
                    id="due-date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add Debt</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {debts.map((debt) => (
          <Card key={debt.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">{debt.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {debt.interest_rate > 0 && `${debt.interest_rate}% APR`}
                    {debt.due_date && ` • Due: ${new Date(debt.due_date).toLocaleDateString()}`}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteDebt(debt.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>${(debt.total_amount - debt.current_balance).toFixed(2)} / ${debt.total_amount.toFixed(2)}</span>
                </div>
                <Progress 
                  value={((debt.total_amount - debt.current_balance) / debt.total_amount) * 100} 
                  className="h-2"
                />
              </div>

              <div className="flex justify-between items-center mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="font-semibold">${debt.current_balance.toFixed(2)}</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="New balance"
                    className="w-32"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const newBalance = parseFloat((e.target as HTMLInputElement).value);
                        if (!isNaN(newBalance)) {
                          updateBalance(debt.id, newBalance);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      const newBalance = parseFloat(input.value);
                      if (!isNaN(newBalance)) {
                        updateBalance(debt.id, newBalance);
                        input.value = '';
                      }
                    }}
                  >
                    Update
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};