import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Transaction {
  id: string;
  description: string;
  merchant?: string;
  amount: number;
  category: string;
  categoryConfidence: number;
  date: string;
  type: string;
}

export default function TransactionsPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryEditId, setCategoryEditId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchTransactions();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, selectedCategory, searchTerm]);

  const fetchTransactions = async () => {
    try {
      const response = await axios.get(`${API_URL}/transactions`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      setTransactions(response.data);
      setTxLoading(false);
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setTxLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tx => tx.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        tx =>
          tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.merchant?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleCategoryChange = async (transactionId: string, category: string) => {
    try {
      await axios.put(`${API_URL}/transactions/${transactionId}/categorize`, { category }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      setTransactions(
        transactions.map(tx => (tx.id === transactionId ? { ...tx, category } : tx)),
      );
      setCategoryEditId(null);
    } catch (error) {
      console.error('Failed to update category:', error);
    }
  };

  const bulkCategorize = async () => {
    try {
      const response = await axios.post(`${API_URL}/transactions/bulk/categorize`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      setTransactions(response.data.transactions);
    } catch (error) {
      console.error('Failed to bulk categorize:', error);
    }
  };

  const categories = Array.from(new Set(transactions.map(tx => tx.category)));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Transactions - Financial Hub</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Financial Hub</h1>
            <div className="flex gap-4 items-center">
              <Link href="/dashboard" className="text-gray-700 hover:text-gray-900 font-medium">
                Dashboard
              </Link>
              <Link href="/accounts" className="text-gray-700 hover:text-gray-900 font-medium">
                Accounts
              </Link>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-gray-900">Transactions</h2>
              <button
                onClick={bulkCategorize}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Auto-Categorize All
              </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by merchant or description..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {txLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg">No transactions found</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Merchant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-900">{tx.merchant || tx.description}</p>
                          <p className="text-gray-500 text-xs">{tx.description}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {categoryEditId === tx.id ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleCategoryChange(tx.id, newCategory);
                                }
                              }}
                            />
                            <button
                              onClick={() =>
                                handleCategoryChange(tx.id, newCategory)
                              }
                              className="px-2 py-1 bg-blue-600 text-white rounded text-sm"
                            >
                              Save
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setCategoryEditId(tx.id);
                              setNewCategory(tx.category);
                            }}
                            className={`px-2 py-1 rounded text-sm ${
                              tx.categoryConfidence > 0.8
                                ? 'bg-green-100 text-green-800'
                                : tx.categoryConfidence > 0.5
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {tx.category}
                            {tx.categoryConfidence < 0.8 && (
                              <span className="text-xs ml-1">
                                ({Math.round(tx.categoryConfidence * 100)}%)
                              </span>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD',
                        }).format(Math.abs(tx.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-8 text-sm text-gray-600">
            <p>Showing {filteredTransactions.length} of {transactions.length} transactions</p>
          </div>
        </div>
      </div>
    </>
  );
}
