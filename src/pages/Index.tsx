import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TransactionForm } from "@/components/TransactionForm";
import { DashboardView } from "@/components/DashboardView";
import { TransactionList } from "@/components/TransactionList";
import { DebtTracker } from "@/components/DebtTracker";
import { SavingsGoals } from "@/components/SavingsGoals";
import { InvestmentTracker } from "@/components/InvestmentTracker";
import { PaycheckSplitGoals } from "@/components/PaycheckSplitGoals";
import { MonthlyAnalytics } from "@/components/MonthlyAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Target, CreditCard, BarChart3 } from "lucide-react";

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
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 wealthsimple-pink rounded-2xl flex items-center justify-center border border-pink-200">
              <span className="text-xl sm:text-2xl">💰</span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Spending Zen</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">Your personal finance companion</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Tabs defaultValue="transactions" className="space-y-6 sm:space-y-8">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-2xl gap-1 sm:gap-0">
            <TabsTrigger value="transactions" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-2">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Transactions</span>
              <span className="sm:hidden">Add</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-2">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Charts</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-2">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-1 sm:gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3 py-2">
              <Target className="w-3 h-3 sm:w-4 sm:h-4" />
              Goals
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <TransactionForm onTransactionAdded={handleTransactionAdded} />
              <TransactionList key={refreshTrigger} onDataChanged={handleDataChanged} />
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <DashboardView refreshTrigger={refreshTrigger} />
            <PaycheckSplitGoals key={refreshTrigger} onDataChanged={handleDataChanged} />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <MonthlyAnalytics />
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DebtTracker key={refreshTrigger} onDataChanged={handleDataChanged} />
              <SavingsGoals key={refreshTrigger} onDataChanged={handleDataChanged} />
            </div>
            <InvestmentTracker key={refreshTrigger} onDataChanged={handleDataChanged} />
          </TabsContent>

        </Tabs>
      </main>
    </div>
  );
};

export default Index;
