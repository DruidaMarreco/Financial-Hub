import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';

interface Account {
  id: string;
  name: string;
  balance: number;
  transactions?: Array<{ amount: number; category: string; date: string }>;
  monthlySpend?: number;
}

export default function AnalyticsPage() {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [dateRange, setDateRange] = useState('3m');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewType, setViewType] = useState('overview');
  const [sortBy, setSortBy] = useState('amount');
  const [monthlyData, setMonthlyData] = useState<Array<{ month: string; amount: number; budget: number }>>([]);
  const [categoryData, setCategoryData] = useState<Array<{ category: string; amount: number; percentage: number }>>([]);
  const [filteredCategories, setFilteredCategories] = useState<Array<{ category: string; amount: number; percentage: number }>>([]);
  const [computedSavingsRate, setComputedSavingsRate] = useState<number | null>(null);
  const [spendTrend, setSpendTrend] = useState<string>('—');

  // Load real data from user accounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('user_accounts');
        if (saved) {
          const accounts: Account[] = JSON.parse(saved);

          // Calculate spending by category from real transactions
          const categoryTotals: { [key: string]: number } = {};
          accounts.forEach(account => {
            if (account.transactions) {
              account.transactions.forEach(tx => {
                const cat = tx.category || 'other';
                categoryTotals[cat] = (categoryTotals[cat] || 0) + Math.abs(tx.amount);
              });
            }
          });

          // Convert to array and calculate percentages
          const totalSpend = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;
          const categories = Object.entries(categoryTotals)
            .map(([category, amount]) => ({
              category: category.charAt(0).toUpperCase() + category.slice(1),
              amount,
              percentage: Math.round((amount / totalSpend) * 100),
            }))
            .sort((a, b) => b.amount - a.amount);

          setCategoryData(categories);
          setFilteredCategories(categories);

          // Build last 6 months of spend data from real transactions
          const now = new Date();
          const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const allTxs = accounts.flatMap((a) => a.transactions ?? []);
          const negTxs = allTxs.filter((t) => t.amount < 0);
          const monthly6: Array<{ month: string; amount: number; budget: number }> = [];
          for (let i = 5; i >= 0; i--) {
            let m = now.getMonth() - i;
            let y = now.getFullYear();
            if (m < 0) { m += 12; y -= 1; }
            const key = `${y}-${String(m + 1).padStart(2, '0')}`;
            const total = negTxs
              .filter((t) => t.date?.startsWith(key))
              .reduce((s, t) => s + Math.abs(t.amount), 0);
            monthly6.push({ month: `${MONTH_NAMES[m]} '${String(y).slice(2)}`, amount: Math.round(total * 100) / 100, budget: 3000 });
          }
          setMonthlyData(monthly6);

          // Savings rate: income vs expenses current month
          const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
          let curIncome = 0; let curExpense = 0;
          allTxs.forEach((t) => {
            if (t.date?.startsWith(curKey)) {
              if (t.amount > 0) curIncome += t.amount;
              else curExpense += Math.abs(t.amount);
            }
          });
          if (curIncome > 0) setComputedSavingsRate(Math.round(((curIncome - curExpense) / curIncome) * 100));

          // Trend: compare last full month to month before it
          const prevKey1 = (() => { let m = now.getMonth() - 1; let y = now.getFullYear(); if (m < 0) { m += 11; y -= 1; } return `${y}-${String(m + 1).padStart(2, '0')}`; })();
          const prevKey2 = (() => { let m = now.getMonth() - 2; let y = now.getFullYear(); if (m < 0) { m += 12; y -= 1; } return `${y}-${String(m + 1).padStart(2, '0')}`; })();
          const prevSpend1 = negTxs.filter((t) => t.date?.startsWith(prevKey1)).reduce((s, t) => s + Math.abs(t.amount), 0);
          const prevSpend2 = negTxs.filter((t) => t.date?.startsWith(prevKey2)).reduce((s, t) => s + Math.abs(t.amount), 0);
          if (prevSpend2 > 0 && prevSpend1 > 0) {
            const pct = Math.round(((prevSpend1 - prevSpend2) / prevSpend2) * 100);
            setSpendTrend(pct > 0 ? `↑ ${pct}%` : `↓ ${Math.abs(pct)}%`);
          }
        }
      } catch (error) {
        console.error('Error loading analytics:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      let sorted = [...categoryData];
      if (sortBy === 'amount') sorted.sort((a, b) => b.amount - a.amount);
      if (sortBy === 'name') sorted.sort((a, b) => a.category.localeCompare(b.category));
      setFilteredCategories(sorted);
    } else {
      setFilteredCategories(
        categoryData.filter((cat) => cat.category.toLowerCase() === selectedCategory.toLowerCase())
      );
    }
  }, [selectedCategory, sortBy]);

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

  if (!isAuthenticated) return null;

  const totalSpending = categoryData.reduce((sum, cat) => sum + cat.amount, 0);
  const avgMonthly = monthlyData.reduce((sum, m) => sum + m.amount, 0) / monthlyData.length;

  return (
    <>
      <Head>
        <title>Analytics - Financial Hub</title>
      </Head>
      <Layout title="Analytics & Insights">
        {/* Controls */}
        <div className="mb-8 bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-3">📅 Time Period</label>
              <div className="flex gap-2">
                {['1m', '3m', '6m', '1y'].map((r) => (
                  <button key={r} onClick={() => setDateRange(r)} className={`px-3 py-1 rounded-lg font-semibold text-sm transition-all ${dateRange === r ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                    {r === '1m' ? '1M' : r === '3m' ? '3M' : r === '6m' ? '6M' : '1Y'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3">🏷️ Category</label>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-sm">
                <option value="all">All</option>
                {categoryData.map((cat) => (
                  <option key={cat.category} value={cat.category.toLowerCase()}>{cat.category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3">📊 Sort</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-medium text-sm">
                <option value="amount">Amount</option>
                <option value="name">Name</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-3">👁️ View</label>
              <div className="flex gap-2">
                <button onClick={() => setViewType('overview')} className={`flex-1 px-3 py-2 text-sm rounded-lg font-semibold transition-all ${viewType === 'overview' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Overview</button>
                <button onClick={() => setViewType('detailed')} className={`flex-1 px-3 py-2 text-sm rounded-lg font-semibold transition-all ${viewType === 'detailed' ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Detailed</button>
              </div>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { icon: '💸', label: 'Total Spending', value: totalSpending > 0 ? `€${totalSpending.toFixed(2)}` : '—' },
            { icon: '📊', label: 'Avg Monthly', value: avgMonthly > 0 ? `€${Math.round(avgMonthly)}` : '—' },
            { icon: '🎯', label: 'Savings Rate', value: computedSavingsRate !== null ? `${computedSavingsRate}%` : '—' },
            { icon: '📈', label: 'vs Last Month', value: spendTrend },
          ].map((m, i) => (
            <div key={i} className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg hover:shadow-xl transition-all cursor-pointer">
              <div className="text-3xl mb-2">{m.icon}</div>
              <p className="text-white/80 text-sm">{m.label}</p>
              <p className="text-2xl font-bold">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Content */}
        {viewType === 'overview' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold mb-6">💰 Monthly Spending</h3>
              {monthlyData.map((item, idx) => (
                <div key={idx} className="hover:bg-gray-50 p-4 rounded-lg transition-all mb-3 cursor-pointer">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">{item.month}</span>
                    <span className="text-sm text-gray-600">€{item.amount.toFixed(0)} / €{item.budget}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className={`h-full transition-all ${item.amount > item.budget ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min((item.amount / item.budget) * 100, 100)}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
              <h3 className="text-2xl font-bold mb-6">🥧 Categories</h3>
              {filteredCategories.map((item, idx) => (
                <div key={idx} className="hover:bg-blue-50 p-4 rounded-xl transition-all mb-3 cursor-pointer">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">{item.category}</span>
                    <span className="font-bold text-blue-600">€{item.amount.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="h-full bg-blue-500" style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-6">📊 Detailed View</h3>
            <p className="text-gray-600">Interactive detailed analytics with drilling and advanced filters.</p>
          </div>
        )}
      </Layout>
    </>
  );
}
