import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { PlaidLink } from '../components/PlaidLink';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  institution: string;
  status: string;
  lastSync?: Date;
}

export default function AccountsPage() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [showPlaidLink, setShowPlaidLink] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAccounts();
    }
  }, [isAuthenticated]);

  const fetchAccounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/accounts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      setAccounts(response.data);
      setAccountsLoading(false);
    } catch (err) {
      setError('Failed to load accounts');
      setAccountsLoading(false);
    }
  };

  const handlePlaidSuccess = () => {
    setShowPlaidLink(false);
    fetchAccounts();
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
        <title>Accounts - Financial Hub</title>
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
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Connected Accounts</h2>
              <p className="text-gray-600 mt-2">Manage your financial accounts</p>
            </div>
            <button
              onClick={() => setShowPlaidLink(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              + Link New Account
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {showPlaidLink && (
            <div className="mb-8 p-6 bg-white rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Link Bank Account</h3>
                <button
                  onClick={() => setShowPlaidLink(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <PlaidLink onSuccess={handlePlaidSuccess} onExit={() => setShowPlaidLink(false)} />
            </div>
          )}

          {accountsLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading accounts...</p>
            </div>
          ) : accounts.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-600 text-lg mb-4">No accounts connected yet</p>
              <button
                onClick={() => setShowPlaidLink(true)}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Link Your First Account
              </button>
            </div>
          ) : (
            <div className="grid gap-6">
              {accounts.map((account) => (
                <div key={account.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{account.institution}</p>
                      <p className="text-gray-500 text-sm mt-1">
                        Type: <span className="capitalize">{account.type}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: account.currency,
                        }).format(account.balance)}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        <span
                          className={`inline-block px-2 py-1 rounded ${
                            account.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {account.status}
                        </span>
                      </p>
                    </div>
                  </div>
                  {account.lastSync && (
                    <p className="text-xs text-gray-500 mt-4">
                      Last synced: {new Date(account.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
