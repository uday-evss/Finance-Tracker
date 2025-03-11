import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['summary'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:3009/api/summary');
      return data;
    }
  });

  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await axios.get('http://localhost:3009/api/transactions');
      return data;
    }
  });

  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(0);

  // Sort transactions by date (most recent first)
  const sortedTransactions = transactions
    ? [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    : [];

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const currentTransactions = sortedTransactions.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Pie Chart Data
  const pieChartData = {
    labels: summary?.monthlyExpenses?.map((exp: any) => exp.category_name) || [],
    datasets: [
      {
        data: summary?.monthlyExpenses?.map((exp: any) => exp.total) || [],
        backgroundColor: ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#6366F1'],
      },
    ],
  };

  // Line Chart Data
  const lineChartData = {
    labels: sortedTransactions?.slice(0, 7).map((t: any) => new Date(t.date).toLocaleDateString()) || [],
    datasets: [
      {
        label: 'Daily Spending',
        data: sortedTransactions?.slice(0, 7).map((t: any) => t.amount) || [],
        borderColor: '#4F46E5',
        tension: 0.4,
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summaryLoading ? (
          <p>Loading summary...</p>
        ) : summaryError ? (
          <p className="text-red-500">Error loading summary</p>
        ) : (
          <>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Total Income</h3>
              <p className="mt-2 text-3xl font-bold text-green-600">
                ${summary?.totalIncome?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Total Expenses</h3>
              <p className="mt-2 text-3xl font-bold text-red-600">
                ${summary?.totalExpenses?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium text-gray-900">Current Balance</h3>
              <p className="mt-2 text-3xl font-bold text-indigo-600">
                ${summary?.balance?.toFixed(2) || '0.00'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Spending by Category</h3>
          <div className="h-64">
            <Pie data={pieChartData} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Spending Trend</h3>
          <div className="h-64">
            <Line data={lineChartData} />
          </div>
        </div>
      </div>

      {/* Recent Transactions with Carousel */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>

        {transactionsLoading ? (
          <p>Loading transactions...</p>
        ) : transactionsError ? (
          <p className="text-red-500">Error loading transactions</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentTransactions.map((transaction: any) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.category_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.description}
                      </td>
                      <td
                        className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between mt-4">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
                disabled={currentPage === 0}
                className={`px-4 py-2 text-white rounded ${currentPage === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700'
                  }`}
              >
                Previous
              </button>

              <span className="text-sm text-gray-700">
                Page {currentPage + 1} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))}
                disabled={currentPage === totalPages - 1}
                className={`px-4 py-2 text-white rounded ${currentPage === totalPages - 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700'
                  }`}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
