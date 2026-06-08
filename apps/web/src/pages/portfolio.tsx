import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AssetAllocation {
  type: string;
  value: number;
  percent: number;
  recommendation: string;
}

interface NetWorthData {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  breakdown: {
    bank: number;
    crypto: number;
    stocks: number;
    realEstate: number;
    vehicles: number;
    bonds: number;
    other: number;
  };
  liabilityBreakdown: {
    mortgages: number;
    carLoans: number;
    creditCard: number;
    studentLoans: number;
    other: number;
  };
}

interface DiversificationAnalysis {
  score: number;
  byType: Record<string, number>;
  risks: string[];
}

export default function PortfolioPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [netWorth, setNetWorth] = useState<NetWorthData | null>(null);
  const [diversification, setDiversification] = useState<DiversificationAnalysis | null>(null);
  const [allocation, setAllocation] = useState<AssetAllocation[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'crypto' | 'stocks' | 'realestate'>('overview');
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchPortfolioData();
    }
  }, [isAuthenticated]);

  const fetchPortfolioData = async () => {
    try {
      setPageLoading(true);
      const headers = { Authorization: `Bearer ${localStorage.getItem('auth_token')}` };

      // Fetch net worth
      const netWorthResponse = await axios.post(
        `${API_URL}/integrations/networth`,
        {
          bankAccounts: [{ balance: 50000 }], // Placeholder
          cryptoWallets: [{ address: '0x...', chain: 'ethereum' }],
          stockHoldings: [],
          properties: [],
          liabilities: {
            mortgages: 0,
            carLoans: 0,
            creditCard: 0,
            studentLoans: 0,
            other: 0,
          },
        },
        { headers },
      );
      setNetWorth(netWorthResponse.data);

      // Fetch diversification
      const diversResponse = await axios.post(
        `${API_URL}/integrations/diversification`,
        [
          { type: 'bank', name: 'Checking', value: 50000, currency: 'USD' },
          { type: 'stocks', name: 'Portfolio', value: 100000, currency: 'USD' },
          { type: 'crypto', name: 'Wallet', value: 25000, currency: 'USD' },
          { type: 'realEstate', name: 'Home', value: 400000, currency: 'USD' },
        ],
        { headers },
      );
      setDiversification(diversResponse.data);

      // Fetch allocation recommendation
      const allocationResponse = await axios.get(
        `${API_URL}/integrations/allocation/recommend/35/moderate`,
        { headers },
      );
      // Convert to AssetAllocation format
      const allocationData = Object.entries(allocationResponse.data).map(([type, percent]) => ({
        type,
        value: 0,
        percent: percent as number,
        recommendation: '',
      }));
      setAllocation(allocationData);
    } catch (error) {
      console.error('Failed to load portfolio data:', error);
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
        <title>Portfolio - Financial Hub</title>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-8">🎯 Multi-Asset Portfolio</h2>

          {pageLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Aggregating your assets...</p>
            </div>
          ) : netWorth ? (
            <div className="space-y-8">
              {/* Net Worth Summary */}
              <section className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600 text-sm font-medium">Total Assets</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    ${netWorth.totalAssets.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <p className="text-gray-600 text-sm font-medium">Total Liabilities</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    ${netWorth.totalLiabilities.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6 border-2 border-green-200">
                  <p className="text-green-800 text-sm font-medium">Net Worth</p>
                  <p className="text-4xl font-bold text-green-700 mt-2">
                    ${netWorth.netWorth.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </section>

              {/* Asset Breakdown */}
              <section>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">💼 Asset Breakdown</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Assets by Type</h4>
                    <div className="space-y-3">
                      {Object.entries(netWorth.breakdown).map(([type, value]) => {
                        const percent = (value / netWorth.totalAssets) * 100;
                        if (value === 0) return null;
                        return (
                          <div key={type} className="flex justify-between items-center">
                            <span className="text-gray-700 capitalize">{type}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                                {percent.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="font-semibold text-gray-900 mb-4">Liabilities by Type</h4>
                    <div className="space-y-3">
                      {Object.entries(netWorth.liabilityBreakdown).map(([type, value]) => {
                        const percent = (value / netWorth.totalLiabilities) * 100;
                        if (value === 0) return null;
                        return (
                          <div key={type} className="flex justify-between items-center">
                            <span className="text-gray-700 capitalize">{type.replace(/([A-Z])/g, ' $1')}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-red-600 h-2 rounded-full"
                                  style={{ width: `${percent}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                                {percent.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              {/* Diversification */}
              {diversification && (
                <section>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">📊 Diversification Analysis</h3>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-gray-600 text-sm">Diversification Score</p>
                        <p className="text-4xl font-bold text-gray-900 mt-1">{diversification.score}/100</p>
                      </div>
                      <div className="w-32 h-32 rounded-full relative">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                          <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="8"
                            strokeDasharray={`${(diversification.score / 100) * 282.6} 282.6`}
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                          {diversification.score.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {diversification.risks.length > 0 && (
                      <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                        <p className="font-semibold text-yellow-800 mb-2">Diversification Alerts:</p>
                        <ul className="space-y-1">
                          {diversification.risks.map((risk, idx) => (
                            <li key={idx} className="text-yellow-700 text-sm">
                              • {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Asset Allocation Recommendation */}
              {allocation.length > 0 && (
                <section>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">🎯 Recommended Allocation</h3>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {allocation.map((asset) => (
                        <div key={asset.type} className="flex items-center gap-4 p-4 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 capitalize">{asset.type}</p>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${asset.percent}%` }}
                              ></div>
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-gray-900 w-16 text-right">
                            {asset.percent.toFixed(0)}%
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg">Unable to load portfolio data.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
