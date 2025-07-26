import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, TrendingUp, TrendingDown } from "lucide-react";

const INVESTMENT_TYPES = [
  "Stocks", "Bonds", "Mutual Funds", "ETFs", "Cryptocurrency", 
  "Real Estate", "Commodities", "Options", "Other"
];

interface Investment {
  id: string;
  name: string;
  investment_type: string;
  amount: number;
  purchase_date: string;
  current_value: number;
}

interface InvestmentTrackerProps {
  onDataChanged?: () => void;
}

export const InvestmentTracker = ({ onDataChanged }: InvestmentTrackerProps) => {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    investment_type: "",
    amount: "",
    purchase_date: new Date().toISOString().split('T')[0],
    current_value: ""
  });

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .order("purchase_date", { ascending: false });

      if (error) throw error;
      setInvestments(data || []);
    } catch (error) {
      console.error("Error fetching investments:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("investments")
        .insert([{
          name: formData.name,
          investment_type: formData.investment_type,
          amount: parseFloat(formData.amount),
          purchase_date: formData.purchase_date,
          current_value: parseFloat(formData.current_value || formData.amount)
        }]);

      if (error) throw error;

      toast.success("Investment added successfully!");
      setFormData({
        name: "",
        investment_type: "",
        amount: "",
        purchase_date: new Date().toISOString().split('T')[0],
        current_value: ""
      });
      setShowForm(false);
      fetchInvestments();
      onDataChanged?.();
    } catch (error) {
      toast.error("Failed to add investment");
      console.error(error);
    }
  };

  const deleteInvestment = async (id: string) => {
    try {
      const { error } = await supabase
        .from("investments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Investment deleted successfully!");
      fetchInvestments();
      onDataChanged?.();
    } catch (error) {
      toast.error("Failed to delete investment");
      console.error(error);
    }
  };

  const updateValue = async (id: string, newValue: number) => {
    try {
      const { error } = await supabase
        .from("investments")
        .update({ current_value: newValue })
        .eq("id", id);

      if (error) throw error;
      toast.success("Value updated!");
      fetchInvestments();
    } catch (error) {
      toast.error("Failed to update value");
      console.error(error);
    }
  };

  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0);
  const totalGainLoss = totalCurrentValue - totalInvested;
  const totalGainLossPercent = totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Investment Tracker</h2>
          <p className="text-muted-foreground">
            Invested: ${totalInvested.toFixed(2)} | Current: ${totalCurrentValue.toFixed(2)} | 
            <span className={totalGainLoss >= 0 ? "text-green-600" : "text-red-600"}>
              {totalGainLoss >= 0 ? " +" : " "}${totalGainLoss.toFixed(2)} ({totalGainLossPercent.toFixed(2)}%)
            </span>
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Investment
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inv-name">Investment Name</Label>
                  <Input
                    id="inv-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Apple Stock, Bitcoin, etc."
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="inv-type">Type</Label>
                  <Select value={formData.investment_type} onValueChange={(value) => setFormData({ ...formData, investment_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {INVESTMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="inv-amount">Amount Invested</Label>
                  <Input
                    id="inv-amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="purchase-date">Purchase Date</Label>
                  <Input
                    id="purchase-date"
                    type="date"
                    value={formData.purchase_date}
                    onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="current-value">Current Value (Optional)</Label>
                <Input
                  id="current-value"
                  type="number"
                  step="0.01"
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                  placeholder="Will default to investment amount"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Add Investment</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {investments.map((investment) => {
          const gainLoss = (investment.current_value || investment.amount) - investment.amount;
          const gainLossPercent = (gainLoss / investment.amount) * 100;
          const isGain = gainLoss >= 0;
          
          return (
            <Card key={investment.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    {isGain ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{investment.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {investment.investment_type} • Purchased: {new Date(investment.purchase_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteInvestment(investment.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Invested</p>
                    <p className="font-semibold">${investment.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Value</p>
                    <p className="font-semibold">${(investment.current_value || investment.amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gain/Loss</p>
                    <p className={`font-semibold ${isGain ? "text-green-600" : "text-red-600"}`}>
                      {isGain ? "+" : ""}${gainLoss.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Return</p>
                    <p className={`font-semibold ${isGain ? "text-green-600" : "text-red-600"}`}>
                      {isGain ? "+" : ""}{gainLossPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Update value"
                    className="w-32"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const newValue = parseFloat((e.target as HTMLInputElement).value);
                        if (!isNaN(newValue)) {
                          updateValue(investment.id, newValue);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      const newValue = parseFloat(input.value);
                      if (!isNaN(newValue)) {
                        updateValue(investment.id, newValue);
                        input.value = '';
                      }
                    }}
                  >
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};