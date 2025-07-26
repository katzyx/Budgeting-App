import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign } from "lucide-react";

const CATEGORIES = [
  "Food & Dining", "Shopping", "Transportation", "Bills & Utilities", 
  "Entertainment", "Health & Fitness", "Travel", "Education", 
  "Gifts & Donations", "Business Services", "Other"
];

export const TransactionForm = ({ onTransactionAdded }: { onTransactionAdded?: () => void }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: "",
    category: "",
    description: "",
    transaction_type: "expense" as "income" | "expense"
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.category) {
      toast.error("Please fill in amount and category");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .insert([{
          date: formData.date,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description,
          transaction_type: formData.transaction_type
        }]);

      if (error) throw error;

      toast.success("Transaction added successfully!");
      setFormData({
        date: new Date().toISOString().split('T')[0],
        amount: "",
        category: "",
        description: "",
        transaction_type: "expense"
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
          <div className="w-10 h-10 wealthsimple-pink rounded-xl flex items-center justify-center border border-pink-200">
            <DollarSign className="w-5 h-5 text-gray-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add Transaction</h2>
            <p className="text-gray-600">Track your income and expenses</p>
          </div>
        </div>
      <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.transaction_type} onValueChange={(value: "income" | "expense") => setFormData({ ...formData, transaction_type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Transaction details..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full wealthsimple-button">
            {isSubmitting ? "Adding..." : "Add Transaction"}
          </Button>
        </form>
      </div>
    );
  };