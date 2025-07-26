import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { format, parseISO } from "date-fns";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  description: string;
  transaction_type: string;
}

interface TransactionListProps {
  onDataChanged?: () => void;
}

export const TransactionList = ({ onDataChanged }: TransactionListProps) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransactions();
  }, []);

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

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Transaction deleted successfully!");
      fetchTransactions();
      onDataChanged?.();
    } catch (error) {
      toast.error("Failed to delete transaction");
      console.error(error);
    }
  };

  const totalIncome = transactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return <div className="text-center p-8">Loading transactions...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span>Total Income: ${totalIncome.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-red-600" />
              <span>Total Expenses: ${totalExpenses.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Net: ${(totalIncome - totalExpenses).toFixed(2)}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {transaction.transaction_type === 'income' ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className="font-medium">
                          {transaction.description || transaction.category}
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {transaction.category}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {format(parseISO(transaction.date), "MMM dd, yyyy")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-lg ${transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      ${transaction.amount.toFixed(2)}
                    </span>
                                         <Button
                       variant="destructive"
                       size="sm"
                       onClick={() => deleteTransaction(transaction.id)}
                     >
                       <Trash2 className="w-4 h-4" />
                     </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found. Add your first transaction to get started!
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 