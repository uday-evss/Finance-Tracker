import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { 
  Wallet, 
  PieChart, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import TransactionForm from './components/TransactionForm';
import BudgetForm from './components/BudgetForm';

const queryClient = new QueryClient();

function App() {
  const [isTransactionModalOpen, setTransactionModalOpen] = React.useState(false);
  const [isBudgetModalOpen, setBudgetModalOpen] = React.useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Wallet className="h-8 w-8 text-indigo-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900">
                  FinanceTracker
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setTransactionModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </button>
                <button
                  onClick={() => setBudgetModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                >
                  <PieChart className="h-4 w-4 mr-2" />
                  Set Budget
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Dashboard />
        </main>

        {isTransactionModalOpen && (
          <TransactionForm onClose={() => setTransactionModalOpen(false)} />
        )}
        
        {isBudgetModalOpen && (
          <BudgetForm onClose={() => setBudgetModalOpen(false)} />
        )}
      </div>
    </QueryClientProvider>
  );
}

export default App;