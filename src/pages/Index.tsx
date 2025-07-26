import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionForm } from "@/components/TransactionForm";
import { SpendingCharts } from "@/components/SpendingCharts";
import { MonthlyTransactions } from "@/components/MonthlyTransactions";
import { TransactionList } from "@/components/TransactionList";
import { DebtTracker } from "@/components/DebtTracker";
import { SavingsGoals } from "@/components/SavingsGoals";
import { InvestmentTracker } from "@/components/InvestmentTracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Target, CreditCard } from "lucide-react";

const Index = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTransactionAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">Personal Budget Tracker</h1>
          <p className="text-muted-foreground">Track your finances, debts, savings, and investments</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="debts" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Debts
            </TabsTrigger>
            <TabsTrigger value="savings" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Savings
            </TabsTrigger>
            <TabsTrigger value="investments" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Investments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Financial Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <SpendingCharts key={refreshTrigger} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            <MonthlyTransactions key={refreshTrigger} />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TransactionForm onTransactionAdded={handleTransactionAdded} />
              <Card>
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <SpendingCharts key={refreshTrigger} />
                </CardContent>
              </Card>
            </div>
            <TransactionList key={refreshTrigger} />
          </TabsContent>

          <TabsContent value="debts">
            <DebtTracker />
          </TabsContent>

          <TabsContent value="savings">
            <SavingsGoals />
          </TabsContent>

          <TabsContent value="investments">
            <InvestmentTracker />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
