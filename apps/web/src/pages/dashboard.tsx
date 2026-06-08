import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function Dashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [loading, isAuthenticated, router]);

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
        <title>Dashboard - Financial Hub</title>
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Navigation */}
        <nav className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Financial Hub</h1>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </nav>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h2>
            <p className="text-gray-600 mt-2">{user?.email}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Net Worth</h3>
              <p className="text-3xl font-bold text-blue-600">$0.00</p>
              <p className="text-gray-500 text-sm">Coming soon</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Accounts</h3>
              <p className="text-3xl font-bold text-green-600">0</p>
              <p className="text-gray-500 text-sm">Connected accounts</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Transactions</h3>
              <p className="text-3xl font-bold text-purple-600">0</p>
              <p className="text-gray-500 text-sm">This month</p>
            </div>
          </div>

          <div className="mt-8 bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Getting Started</h3>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-center">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Connect bank accounts via Plaid (Coming soon)
              </li>
              <li className="flex items-center">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Track investments and crypto portfolios
              </li>
              <li className="flex items-center">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Categorize transactions automatically
              </li>
              <li className="flex items-center">
                <span className="inline-block w-2 h-2 bg-blue-600 rounded-full mr-3"></span>
                Get personalized financial insights
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
