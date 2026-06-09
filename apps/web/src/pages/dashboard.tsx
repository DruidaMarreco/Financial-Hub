import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
  institution: string;
  transactions?: Array<{ amount: number; date: string; category: string }>;
  monthlySpend?: number;
  balanceHistory?: Array<{ date: string; balance: number }>;
}

export default function Dashboard() {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [accountCount, setAccountCount] = useState(0);
  const [transactionCount, setTransactionCount] = useState(0);
  const [monthlySpend, setMonthlySpend] = useState(0);
  const [savingsRate, setSavingsRate] = useState<number | null>(null);
  const [monthlyIncome, setMonthlyIncome] = useState(0);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [loading, isAuthenticated, router]);

  // Load real data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('user_accounts');
        if (saved) {
          const parsedAccounts = JSON.parse(saved) as Account[];
          setAccounts(parsedAccounts);

          // Calculate real metrics
          const total = parsedAccounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
          const txCount = parsedAccounts.reduce((sum, acc) => sum + (acc.transactions?.length || 0), 0);
          const spend = parsedAccounts.reduce((sum, acc) => sum + (acc.monthlySpend || 0), 0);

          // Compute current month income & savings rate from transactions
          const now = new Date();
          const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          let incomeThisMonth = 0;
          let expenseThisMonth = 0;
          parsedAccounts.forEach((acc) => {
            (acc.transactions || []).forEach((tx) => {
              if (tx.date?.startsWith(currentMonth)) {
                if (tx.amount > 0) incomeThisMonth += tx.amount;
                else expenseThisMonth += Math.abs(tx.amount);
              }
            });
          });
          const computedSavingsRate = incomeThisMonth > 0
            ? Math.round(((incomeThisMonth - expenseThisMonth) / incomeThisMonth) * 100)
            : null;

          setTotalBalance(total);
          setAccountCount(parsedAccounts.length);
          setTransactionCount(txCount);
          setMonthlySpend(spend);
          setMonthlyIncome(incomeThisMonth);
          setSavingsRate(computedSavingsRate);
        }
      } catch (error) {
        console.error('Error loading accounts:', error);
      }
    }
  }, []);

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

      <Layout title={`Welcome back, ${user?.name}!`}>
        <div className="mb-8">
          <p className="text-gray-600">Email: {user?.email}</p>
        </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Net Worth Card */}
            <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:border-blue-200/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute top-4 right-4 text-3xl">💰</div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Balance</h3>
              <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-3">
                €{totalBalance.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">{accountCount} account{accountCount !== 1 ? 's' : ''}</p>
              <div className="mt-4 h-1 bg-gradient-to-r from-blue-200 to-transparent rounded-full"></div>
            </div>

            {/* Accounts Card */}
            <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:border-green-200/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute top-4 right-4 text-3xl">🏦</div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Connected Accounts</h3>
              <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600 mb-3">
                {accountCount}
              </p>
              <p className="text-xs text-gray-500">{accountCount === 0 ? 'Ready to connect' : 'Synced & active'}</p>
              <div className="mt-4 h-1 bg-gradient-to-r from-green-200 to-transparent rounded-full"></div>
            </div>

            {/* Monthly Spend Card */}
            <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:border-purple-200/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute top-4 right-4 text-3xl">💳</div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Monthly Spend</h3>
              <p className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600 mb-3">
                €{monthlySpend.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">{transactionCount} transaction{transactionCount !== 1 ? 's' : ''}</p>
              <div className="mt-4 h-1 bg-gradient-to-r from-purple-200 to-transparent rounded-full"></div>
            </div>
          </div>

          {/* Getting Started Section */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-lg">
                🚀
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Getting Started</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  icon: '🔗',
                  title: 'Connect Bank Accounts',
                  description: 'Link Revolut via OAuth or use Demo Bank to import 90 days of sample data',
                  status: 'Available'
                },
                {
                  icon: '📊',
                  title: 'Track Investments',
                  description: 'Monitor stocks, crypto, and real estate portfolios in one place',
                  status: 'Available'
                },
                {
                  icon: '🤖',
                  title: 'Auto-Categorize',
                  description: 'AI automatically categorizes your transactions for better insights',
                  status: 'Available'
                },
                {
                  icon: '💡',
                  title: 'Get Insights',
                  description: 'Receive personalized financial recommendations and analysis',
                  status: 'Available'
                },
              ].map((item, idx) => (
                <div key={idx} className="group p-6 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{item.icon}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      item.status === 'Coming soon'
                        ? 'bg-gray-100 text-gray-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                label: 'This Month Spending',
                value: monthlySpend > 0 ? `€${monthlySpend.toFixed(2)}` : accountCount > 0 ? '€0.00' : '—',
                icon: '💸',
              },
              {
                label: 'Savings Rate',
                value: savingsRate !== null ? `${savingsRate}%` : accountCount > 0 ? 'N/A' : '—',
                icon: '📈',
              },
              {
                label: 'Monthly Income',
                value: monthlyIncome > 0 ? `€${monthlyIncome.toFixed(2)}` : accountCount > 0 ? '€0.00' : '—',
                icon: '🎯',
              },
              {
                label: 'Transactions',
                value: transactionCount > 0 ? String(transactionCount) : '—',
                icon: '⭐',
              },
            ].map((stat, idx) => (
              <div key={idx} className="bg-white/60 backdrop-blur rounded-lg p-4 text-center border border-white/20 hover:shadow-md transition-all">
                <div className="text-2xl mb-2">{stat.icon}</div>
                <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>
      </Layout>
    </>
  );
}
