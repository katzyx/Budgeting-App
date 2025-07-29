import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, Settings } from "lucide-react";

interface TransactionType {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

export const ManageTransactionTypes = () => {
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [typesResult, categoriesResult] = await Promise.all([
      supabase.from("transaction_types").select("id, name").order("name"),
      supabase.from("transaction_categories").select("id, name").order("name")
    ]);
    
    if (typesResult.data) setTypes(typesResult.data);
    if (categoriesResult.data) setCategories(categoriesResult.data);
  };

  const addType = async () => {
    if (!newTypeName.trim()) return;
    setLoading(true);
    
    const { error } = await supabase
      .from("transaction_types")
      .insert([{ name: newTypeName.trim() }]);
    
    if (error) {
      toast.error("Failed to add transaction type");
    } else {
      toast.success("Transaction type added");
      setNewTypeName("");
      fetchData();
    }
    setLoading(false);
  };

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    setLoading(true);
    
    const { error } = await supabase
      .from("transaction_categories")
      .insert([{ name: newCategoryName.trim() }]);
    
    if (error) {
      toast.error("Failed to add category");
    } else {
      toast.success("Category added");
      setNewCategoryName("");
      fetchData();
    }
    setLoading(false);
  };

  const deleteType = async (id: string) => {
    const { error } = await supabase
      .from("transaction_types")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast.error("Failed to delete transaction type");
    } else {
      toast.success("Transaction type deleted");
      fetchData();
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase
      .from("transaction_categories")
      .delete()
      .eq("id", id);
    
    if (error) {
      toast.error("Failed to delete category");
    } else {
      toast.success("Category deleted");
      fetchData();
    }
  };

  return (
    <div className="wealthsimple-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30">
          <Settings className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">Manage Transaction Types & Categories</h2>
          <p className="text-sm text-muted-foreground truncate">Customize your transaction options</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transaction Types */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Transaction Types</h3>
          
          <div className="flex gap-2">
            <Input
              placeholder="New type name"
              value={newTypeName}
              onChange={(e) => setNewTypeName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addType()}
              className="flex-1"
            />
            <Button 
              onClick={addType} 
              disabled={loading || !newTypeName.trim()}
              size="sm"
              className="px-3"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {types.map((type) => (
              <div key={type.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-foreground truncate flex-1 mr-2">{type.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteType(type.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1 h-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Categories</h3>
          
          <div className="flex gap-2">
            <Input
              placeholder="New category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCategory()}
              className="flex-1"
            />
            <Button 
              onClick={addCategory} 
              disabled={loading || !newCategoryName.trim()}
              size="sm"
              className="px-3"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <span className="text-sm font-medium text-foreground truncate flex-1 mr-2">{category.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteCategory(category.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 p-1 h-auto"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};