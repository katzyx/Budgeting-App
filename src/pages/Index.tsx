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

  const handleDataChanged = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <header className="wealthsimple-pink border-b border-pink-200">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 wealthsimple-pink rounded-2xl flex items-center justify-center border border-pink-200">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Spending Zen</h1>
              <p className="text-gray-600 mt-1">Your personal finance companion</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="dashboard" className="space-y-8">
          <TabsList className="grid w-full grid-cols-6 bg-gray-100 p-1 rounded-2xl">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200">
              <TrendingUp className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="monthly" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200">
              <DollarSign className="w-4 h-4" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200">
              <DollarSign className="w-4 h-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="debts" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200">
              <CreditCard className="w-4 h-4" />
              Debts
            </TabsTrigger>
            <TabsTrigger value="savings" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200">
              <Target className="w-4 h-4" />
              Savings
            </TabsTrigger>
            <TabsTrigger value="investments" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200">
              <TrendingUp className="w-4 h-4" />
              Investments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-8">
            <div className="wealthsimple-card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 wealthsimple-pink rounded-xl flex items-center justify-center border border-pink-200">
                  <TrendingUp className="w-5 h-5 text-gray-700" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Financial Overview</h2>
                  <p className="text-gray-600">Your complete financial picture</p>
                </div>
              </div>
              <SpendingCharts key={refreshTrigger} />
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            <MonthlyTransactions key={refreshTrigger} onDataChanged={handleDataChanged} />
          </TabsContent>

          <TabsContent value="transactions" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <TransactionForm onTransactionAdded={handleTransactionAdded} />
              <div className="wealthsimple-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 wealthsimple-pink rounded-xl flex items-center justify-center border border-pink-200">
                    <span className="text-gray-700 text-lg">📊</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Quick Stats</h2>
                    <p className="text-gray-600">Your financial overview</p>
                  </div>
                </div>
                <SpendingCharts key={refreshTrigger} />
              </div>
            </div>
            <TransactionList key={refreshTrigger} onDataChanged={handleDataChanged} />
          </TabsContent>

          <TabsContent value="debts">
            <DebtTracker key={refreshTrigger} onDataChanged={handleDataChanged} />
          </TabsContent>

          <TabsContent value="savings">
            <SavingsGoals key={refreshTrigger} onDataChanged={handleDataChanged} />
          </TabsContent>

          <TabsContent value="investments">
            <InvestmentTracker key={refreshTrigger} onDataChanged={handleDataChanged} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
