import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

interface TransactionType {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface TransactionFormProps {
  onTransactionAdded?: () => void;
  prefillType?: string;
  prefillGoalId?: string;
}

export const TransactionForm = ({ onTransactionAdded, prefillType = "Expense", prefillGoalId = "" }: TransactionFormProps) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: "",
    category: "",
    description: "",
    type: prefillType,
    linkedDebtId: prefillType === "Debt Payment" ? prefillGoalId : "",
    linkedGoalId: prefillType === "Savings" ? prefillGoalId : "",
    linkedInvestmentId: prefillType === "Investment" ? prefillGoalId : ""
  });
  const [debts, setDebts] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch all data for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      const [debtsResult, goalsResult, investmentsResult, typesResult, categoriesResult] = await Promise.all([
        supabase.from("debts").select("id, name, current_balance, total_amount"),
        supabase.from("savings_goals").select("id, name, current_amount, target_amount"),
        supabase.from("investments").select("id, name, current_value, amount"),
        supabase.from("transaction_types").select("id, name").order("name"),
        supabase.from("transaction_categories").select("id, name").order("name")
      ]);
      
      setDebts(debtsResult.data || []);
      setGoals(goalsResult.data || []);
      setInvestments(investmentsResult.data || []);
      setTransactionTypes(typesResult.data || []);
      setCategories(categoriesResult.data || []);
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category || !formData.type) {
      toast.error("Please fill in amount, category, and type");
      return;
    }
    setIsSubmitting(true);
    try {
      // Insert transaction
      const insertObj: any = {
        date: formData.date,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        type: formData.type,
        linkedDebtId: formData.type === "Debt Payment" ? formData.linkedDebtId : null,
        linkedGoalId: formData.type === "Savings" ? formData.linkedGoalId : null,
        linkedInvestmentId: formData.type === "Investment" ? formData.linkedInvestmentId : null
      };
      const { error } = await supabase.from("transactions").insert([insertObj]);
      if (error) throw error;

      // Update related entity
      if (formData.type === "Debt Payment" && formData.linkedDebtId) {
        // Subtract amount from debt.current_balance
        const debt = debts.find(d => d.id === formData.linkedDebtId);
        const newBalance = (debt?.current_balance || 0) - parseFloat(formData.amount);
        await supabase.from("debts").update({ current_balance: newBalance }).eq("id", formData.linkedDebtId);
      }
      if (formData.type === "Savings" && formData.linkedGoalId) {
        const goal = goals.find(g => g.id === formData.linkedGoalId);
        const newSaved = (goal?.current_amount || 0) + parseFloat(formData.amount);
        await supabase.from("savings_goals").update({ current_amount: newSaved }).eq("id", formData.linkedGoalId);
      }
      if (formData.type === "Investment" && formData.linkedInvestmentId) {
        const investment = investments.find(i => i.id === formData.linkedInvestmentId);
        const newValue = (investment?.current_value || 0) + parseFloat(formData.amount);
        await supabase.from("investments").update({ current_value: newValue }).eq("id", formData.linkedInvestmentId);
      }

      toast.success("Transaction added successfully!");
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: "",
        category: "",
        description: "",
        type: "Expense",
        linkedDebtId: "",
        linkedGoalId: "",
        linkedInvestmentId: ""
      });
      onTransactionAdded?.();
    } catch (error) {
      toast.error("Failed to add transaction");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="wealthsimple-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
          <DollarSign className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">Add Transaction</h2>
          <p className="text-sm text-muted-foreground truncate">Track your finances</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="min-w-0">
            <Label htmlFor="date" className="text-sm font-medium">Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full text-sm sm:text-base mt-1"
              required
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="amount" className="text-sm font-medium">Amount ($)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full text-sm sm:text-base mt-1"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="min-w-0">
            <Label htmlFor="type" className="text-sm font-medium">Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger className="w-full text-sm sm:text-base mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {transactionTypes.map((type) => (
                  <SelectItem key={type.id} value={type.name}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-w-0">
            <Label htmlFor="category" className="text-sm font-medium">Category</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger className="w-full text-sm sm:text-base mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Dynamic dropdowns for linked entities */}
        {formData.type === "Debt Payment" && (
          <div>
            <Label htmlFor="linkedDebtId">Select Debt</Label>
            <Select value={formData.linkedDebtId} onValueChange={(value) => setFormData({ ...formData, linkedDebtId: value })}>
              <SelectTrigger className="w-full text-base">
                <SelectValue placeholder="Select debt" />
              </SelectTrigger>
              <SelectContent>
                {debts.map((debt) => (
                  <SelectItem key={debt.id} value={debt.id}>{debt.name} (${debt.current_balance.toFixed(2)} left)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {formData.type === "Savings" && (
          <div>
            <Label htmlFor="linkedGoalId">Select Savings Goal</Label>
            <Select value={formData.linkedGoalId} onValueChange={(value) => setFormData({ ...formData, linkedGoalId: value })}>
              <SelectTrigger className="w-full text-base">
                <SelectValue placeholder="Select goal" />
              </SelectTrigger>
              <SelectContent>
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>{goal.name} (${goal.current_amount.toFixed(2)} saved)</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {formData.type === "Investment" && (
          <div>
            <Label htmlFor="linkedInvestmentId">Select Investment</Label>
            <Select value={formData.linkedInvestmentId} onValueChange={(value) => setFormData({ ...formData, linkedInvestmentId: value })}>
              <SelectTrigger className="w-full text-base">
                <SelectValue placeholder="Select investment" />
              </SelectTrigger>
              <SelectContent>
                {investments.map((inv) => (
                  <SelectItem key={inv.id} value={inv.id}>{inv.name} (${inv.current_value?.toFixed(2) ?? inv.amount.toFixed(2)})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="min-w-0">
          <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
          <Textarea
            id="description"
            placeholder="Transaction details..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full text-sm sm:text-base resize-none mt-1"
            rows={3}
          />
        </div>

        <Button 
          type="submit" 
          disabled={isSubmitting} 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 sm:py-3 text-sm sm:text-base rounded-xl transition-all duration-200"
        >
          {isSubmitting ? "Adding..." : "Add Transaction"}
        </Button>
      </form>
    </div>
  );
}