import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { SpendingTrendChart } from '../components/charts/SpendingTrendChart';
import { CategoryBreakdownChart } from '../components/charts/CategoryBreakdownChart';
import { SpendingHeatmap } from '../components/charts/SpendingHeatmap';
import { NetWorthChart } from '../components/charts/NetWorthChart';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ChartData {
  spending?: Array<{ month: string; spending: number; budget?: number }>;
  categories?: Array<{ name: string; value: number }>;
  heatmap?: Array<{ month: string; category: string; value: number }>;
  netWorth?: Array<{ date: string; assets: number; liabilities: number; netWorth: number }>;
}

export default function VisualizationsPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [chartData, setChartData] = useState<ChartData>({});
  const [selectedTab, setSelectedTab] = useState<'spending' | 'breakdown' | 'heatmap' | 'networth'>('spending');
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchChartData();
    }
  }, [isAuthenticated]);

  const fetchChartData = async () => {
    try {
      setPageLoading(true);
      const headers = { Authorization: `Bearer ${localStorage.getItem('auth_token')}` };

      // Simulate data fetching - replace with actual API calls
      const mockSpendingData = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(Date.now() - (12 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
        spending: Math.random() * 2000 + 1000,
        budget: 2000,
      }));

      const mockCategoryData = [
        { name: 'Groceries', value: 450 },
        { name: 'Dining', value: 320 },
        { name: 'Transportation', value: 280 },
        { name: 'Entertainment', value: 190 },
        { name: 'Utilities', value: 220 },
        { name: 'Shopping', value: 410 },
        { name: 'Other', value: 130 },
      ];

      const mockHeatmapData = [];
      const categories = ['Groceries', 'Dining', 'Transportation', 'Entertainment', 'Utilities'];
      for (let i = 0; i < 12; i++) {
        for (const cat of categories) {
          mockHeatmapData.push({
            month: new Date(Date.now() - (12 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
            category: cat,
            value: Math.random() * 500 + 100,
          });
        }
      }

      const mockNetWorthData = Array.from({ length: 12 }, (_, i) => {
        const baseAssets = 100000 + i * 5000;
        const baseLiabilities = 30000 - i * 2000;
        return {
          date: new Date(Date.now() - (12 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
          assets: baseAssets,
          liabilities: Math.max(0, baseLiabilities),
          netWorth: baseAssets - Math.max(0, baseLiabilities),
        };
      });

      setChartData({
        spending: mockSpendingData,
        categories: mockCategoryData,
        heatmap: mockHeatmapData,
        netWorth: mockNetWorthData,
      });
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setPageLoading(false);
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
        <title>Visualizations - Financial Hub</title>
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
              <Link href="/portfolio" className="text-gray-700 hover:text-gray-900 font-medium">
                Portfolio
              </Link>
              <Link href="/insights" className="text-gray-700 hover:text-gray-900 font-medium">
                Insights
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
          <h2 className="text-3xl font-bold text-gray-900 mb-8">📊 Beautiful Visualizations</h2>

          {pageLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading charts...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Tab Navigation */}
              <div className="flex gap-4 border-b border-gray-200">
                {[
                  { id: 'spending', label: '📈 Spending Trends', icon: '📈' },
                  { id: 'breakdown', label: '🥧 Category Breakdown', icon: '🥧' },
                  { id: 'heatmap', label: '🔥 Spending Heatmap', icon: '🔥' },
                  { id: 'networth', label: '💰 Net Worth Evolution', icon: '💰' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedTab(tab.id as any)}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                      selectedTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Spending Trends */}
              {selectedTab === 'spending' && chartData.spending && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Spending Trends</h3>
                    <div className="flex gap-2">
                      {(['line', 'bar'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setChartType(type)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            chartType === type
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {type === 'line' ? 'Line' : 'Bar'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <SpendingTrendChart data={chartData.spending} type={chartType} showBudget={true} />
                </div>
              )}

              {/* Category Breakdown */}
              {selectedTab === 'breakdown' && chartData.categories && (
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Category Breakdown</h3>
                    <div className="flex gap-2">
                      {(['pie', 'bar'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setChartType(type as any)}
                          className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                            chartType === type
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {type === 'pie' ? 'Pie' : 'Bar'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <CategoryBreakdownChart data={chartData.categories} type={chartType === 'line' ? 'bar' : (chartType as any)} />
                </div>
              )}

              {/* Spending Heatmap */}
              {selectedTab === 'heatmap' && chartData.heatmap && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Spending Heatmap</h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    Visualize spending patterns across categories and months. Darker red indicates higher spending.
                  </p>
                  <SpendingHeatmap data={chartData.heatmap} />
                </div>
              )}

              {/* Net Worth Evolution */}
              {selectedTab === 'networth' && chartData.netWorth && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Net Worth Evolution</h3>
                  <NetWorthChart data={chartData.netWorth} showComposed={true} />
                </div>
              )}

              {/* Chart Insights */}
              <div className="grid md:grid-cols-3 gap-6 pt-8">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">💡 Insight</h4>
                  <p className="text-sm text-blue-800">
                    Your spending is trending up by 12% this month. Focus on discretionary categories to control costs.
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">✅ Achievement</h4>
                  <p className="text-sm text-green-800">
                    You're saving 15% of your income this month. Keep up the great work!
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-6 border border-amber-200">
                  <h4 className="font-semibold text-amber-900 mb-2">⚠️ Alert</h4>
                  <p className="text-sm text-amber-800">
                    Your utilities spending spiked by 25% last month. Check for unusual charges.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
