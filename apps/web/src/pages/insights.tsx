import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Recommendation {
  type: 'optimization' | 'insight' | 'warning' | 'opportunity';
  title: string;
  description: string;
  impact: string;
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
}

interface Insights {
  forecasts: any[];
  patterns: any;
  groups: any[];
  recommendations: Recommendation[];
  insights: string[];
}

export default function InsightsPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [insights, setInsights] = useState<Insights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInsights();
    }
  }, [isAuthenticated]);

  const fetchInsights = async () => {
    try {
      const response = await axios.get(`${API_URL}/intelligence/insights`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      setInsights(response.data);
      setInsightsLoading(false);
    } catch (error) {
      console.error('Failed to load insights:', error);
      setInsightsLoading(false);
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
        <title>AI Insights - Financial Hub</title>
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
              <Link href="/analytics" className="text-gray-700 hover:text-gray-900 font-medium">
                Analytics
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
          <h2 className="text-3xl font-bold text-gray-900 mb-8">🧠 AI-Powered Insights</h2>

          {insightsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Analyzing your spending patterns...</p>
            </div>
          ) : insights ? (
            <div className="space-y-8">
              {/* Recommendations */}
              <section>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">💡 Personalized Recommendations</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {insights.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-6 rounded-lg border-l-4 ${
                        rec.priority === 'high'
                          ? 'bg-red-50 border-red-500'
                          : rec.priority === 'medium'
                          ? 'bg-yellow-50 border-yellow-500'
                          : 'bg-blue-50 border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            rec.type === 'warning'
                              ? 'bg-red-200 text-red-800'
                              : rec.type === 'opportunity'
                              ? 'bg-green-200 text-green-800'
                              : 'bg-blue-200 text-blue-800'
                          }`}
                        >
                          {rec.type}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{rec.description}</p>
                      <div className="flex justify-between items-center">
                        <p className="font-semibold text-gray-900">{rec.impact}</p>
                        {rec.actionable && <span className="text-green-600 text-sm">✓ Actionable</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Insights */}
              {insights.insights.length > 0 && (
                <section>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">📊 Key Insights</h3>
                  <div className="bg-white rounded-lg shadow p-6">
                    <ul className="space-y-3">
                      {insights.insights.map((insight, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="text-blue-600 font-bold">•</span>
                          <span className="text-gray-700">{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              )}

              {/* Forecasts */}
              {insights.forecasts.length > 0 && (
                <section>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">📈 6-Month Forecasts</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {insights.forecasts.slice(0, 6).map((forecast, idx) => (
                      <div key={idx} className="bg-white rounded-lg shadow p-6">
                        <h4 className="font-semibold text-gray-900 capitalize mb-4">{forecast.category}</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Trend:</span>
                            <span className="font-semibold capitalize">{forecast.trend}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Seasonality:</span>
                            <span className="font-semibold">{(forecast.seasonality * 100).toFixed(0)}%</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t">
                            <span className="text-gray-600">Next month:</span>
                            <span className="font-semibold">
                              ${forecast.predictions[0]?.predicted.toFixed(2) || '?'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Transaction Groups */}
              {insights.groups.length > 0 && (
                <section>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">🏷️ Transaction Groups</h3>
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Merchant
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Count
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Total
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Frequency
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {insights.groups.slice(0, 10).map((group, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{group.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-600">{group.count}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              ${group.totalAmount.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600 capitalize">
                              {group.frequency.replace(/_/g, ' ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg">No insights available yet. Link accounts and transactions to get started.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
