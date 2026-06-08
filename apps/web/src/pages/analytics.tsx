import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface FinancialGoals {
  netWorth: number;
  monthlyExpenses: number;
  annualExpenses: number;
  fiNumber: number;
  fiProgress: number;
  runway: number;
  runoutDate: string;
  savingsRate: number;
}

interface CashFlow {
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
  byCategory: Record<string, number>;
}

export default function AnalyticsPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [goals, setGoals] = useState<FinancialGoals | null>(null);
  const [cashflow, setCashflow] = useState<CashFlow | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [mode, setMode] = useState<'freedom' | 'cashflow' | 'forecast'>('freedom');
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAnalytics();
    }
  }, [isAuthenticated]);

  const fetchAnalytics = async () => {
    try {
      const goalsRes = await axios.get(`${API_URL}/analytics/goals`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      });
      setGoals(goalsRes.data);

      const cashflowRes = await axios.get(`${API_URL}/analytics/cashflow`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
      });
      setCashflow(cashflowRes.data);

      setAnalyticsLoading(false);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      setAnalyticsLoading(false);
    }
  };

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
        <title>Analytics - Financial Hub</title>
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
              <Link href="/transactions" className="text-gray-700 hover:text-gray-900 font-medium">
                Transactions
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
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Financial Analytics</h2>

            {/* Mode Selector */}
            <div className="flex gap-4 mb-6">
              {['freedom', 'cashflow', 'forecast'].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    mode === m
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300'
                  }`}
                >
                  {m === 'freedom' ? '🎯 Freedom Tracker' : m === 'cashflow' ? '💰 Cash Flow' : '📈 Forecast'}
                </button>
              ))}
            </div>
          </div>

          {analyticsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading analytics...</p>
            </div>
          ) : (
            <>
              {mode === 'freedom' && goals && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Independence</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-600 text-sm">FI Number (FIRE Target)</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ${goals.fiNumber.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Current Progress</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${Math.min(goals.fiProgress, 100)}%` }}
                            ></div>
                          </div>
                          <p className="font-semibold">{Math.round(goals.fiProgress)}%</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Runway</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-gray-600 text-sm">Months of Expenses Covered</p>
                        <p className="text-3xl font-bold text-green-600">{goals.runway} months</p>
                      </div>
                      <div>
                        <p className="text-gray-600 text-sm">Before Funds Depleted</p>
                        <p className="text-lg text-gray-900">{new Date(goals.runoutDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Income</span>
                        <span className="font-semibold text-green-600">+${(goals.annualExpenses / goals.savingsRate).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Expenses</span>
                        <span className="font-semibold text-red-600">-${goals.monthlyExpenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="font-medium">Savings Rate</span>
                        <span className="font-bold text-blue-600">{(goals.savingsRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Worth</h3>
                    <p className="text-3xl font-bold text-gray-900">
                      ${goals.netWorth.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              )}

              {mode === 'cashflow' && cashflow && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">This Month's Cash Flow</h3>
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center">
                      <p className="text-gray-600 text-sm mb-2">Income</p>
                      <p className="text-3xl font-bold text-green-600">
                        ${cashflow.income.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 text-sm mb-2">Expenses</p>
                      <p className="text-3xl font-bold text-red-600">
                        ${cashflow.expenses.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-600 text-sm mb-2">Savings</p>
                      <p className="text-3xl font-bold text-blue-600">
                        ${cashflow.savings.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-4">Expenses by Category</h4>
                    <div className="space-y-3">
                      {Object.entries(cashflow.byCategory)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([category, amount]) => (
                          <div key={category} className="flex justify-between items-center">
                            <span className="text-gray-700 capitalize">{category}</span>
                            <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${(amount / Math.max(...Object.values(cashflow.byCategory))) * 100}%`,
                                }}
                              ></div>
                            </div>
                            <span className="font-semibold text-gray-900 w-20 text-right">
                              ${amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {mode === 'forecast' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Spending Forecast</h3>
                  <p className="text-gray-600">Forecast data will appear after sufficient transaction history is available.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
