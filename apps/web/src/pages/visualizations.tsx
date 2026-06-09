import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../hooks/useAuth';
import Layout from '../components/Layout';
import { CategoryBreakdownChart, CategoryData } from '../components/charts/CategoryBreakdownChart';
import { SpendingTrendChart, SpendingData } from '../components/charts/SpendingTrendChart';
import { NetWorthChart, NetWorthData } from '../components/charts/NetWorthChart';
import { SpendingHeatmap, HeatmapData } from '../components/charts/SpendingHeatmap';

interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  description: string;
}

interface BalancePoint {
  date: string;
  balance: number;
}

interface Account {
  id: string;
  name: string;
  balance: number;
  transactions?: Transaction[];
  balanceHistory?: BalancePoint[];
}

type TimeRange = '1M' | '3M' | '6M';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function VisualizationsPage() {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('3M');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/signin');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('user_accounts');
        if (stored) setAccounts(JSON.parse(stored));
      } catch { /* ignore */ }
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
  if (!isAuthenticated) return null;

  const now = new Date();
  const timeRangeMonths = timeRange === '1M' ? 1 : timeRange === '3M' ? 3 : 6;
  const cutoff = new Date(now.getFullYear(), now.getMonth() - timeRangeMonths + 1, 1);

  const allTxs = accounts.flatMap((a) => a.transactions ?? []);
  const negativeTxs = allTxs.filter((t) => t.amount < 0);
  const filteredNegTxs = negativeTxs.filter((t) => new Date(t.date) >= cutoff);

  // ── Category breakdown ──────────────────────────────────────────────────────
  const catMap = new Map<string, number>();
  for (const tx of filteredNegTxs) {
    const cat = tx.category || 'other';
    catMap.set(cat, (catMap.get(cat) ?? 0) + Math.abs(tx.amount));
  }
  const totalSpend = Array.from(catMap.values()).reduce((s, v) => s + v, 0);
  const categoryData: CategoryData[] = Array.from(catMap.entries())
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: totalSpend > 0 ? Math.round((value / totalSpend) * 100) : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // ── Spending trend (always last 6 months) ───────────────────────────────────
  const spendingTrendData: SpendingData[] = [];
  for (let i = 5; i >= 0; i--) {
    let month = now.getMonth() - i;
    let year = now.getFullYear();
    if (month < 0) { month += 12; year -= 1; }
    const label = `${MONTH_NAMES[month]} ${String(year).slice(2)}`;
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 1);
    const total = negativeTxs
      .filter((t) => { const d = new Date(t.date); return d >= monthStart && d < monthEnd; })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    spendingTrendData.push({ date: label, amount: Math.round(total * 100) / 100 });
  }

  // ── Net worth history ───────────────────────────────────────────────────────
  const nwMap = new Map<string, number>();
  for (const account of accounts) {
    for (const point of account.balanceHistory ?? []) {
      nwMap.set(point.date, (nwMap.get(point.date) ?? 0) + point.balance);
    }
  }
  const netWorthData: NetWorthData[] = Array.from(nwMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, value]) => ({ date, value: Math.round(value * 100) / 100 }));

  // ── Weekly heatmap ──────────────────────────────────────────────────────────
  const dayTotals: number[] = Array(7).fill(0);
  const dayCounts: number[] = Array(7).fill(0);
  for (const tx of negativeTxs) {
    const jsDay = new Date(tx.date).getDay(); // 0=Sun..6=Sat
    const idx = jsDay === 0 ? 6 : jsDay - 1; // Mon=0..Sun=6
    dayTotals[idx] += Math.abs(tx.amount);
    dayCounts[idx] += 1;
  }
  const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const heatmapData: HeatmapData[] = DAY_NAMES.map((day, i) => ({
    day,
    amount: dayCounts[i] > 0 ? Math.round((dayTotals[i] / dayCounts[i]) * 100) / 100 : 0,
  }));

  return (
    <>
      <Head><title>Charts - Financial Hub</title></Head>
      <Layout title="Charts & Visualizations">
        {/* Time range selector */}
        <div className="flex gap-2 mb-8">
          {(['1M', '3M', '6M'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                timeRange === range
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-white/80 text-gray-600 border border-gray-200 hover:bg-white hover:border-blue-300'
              }`}
            >
              {range}
            </button>
          ))}
          <span className="ml-2 text-sm text-gray-500 self-center">time window</span>
        </div>

        {/* 2×2 Chart grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Spending by Category</h2>
            <p className="text-sm text-gray-500 mb-5">Where your money goes in the selected period</p>
            <CategoryBreakdownChart data={categoryData} />
          </div>

          {/* Monthly Trend */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Monthly Spending Trend</h2>
            <p className="text-sm text-gray-500 mb-5">Last 6 months of total spending</p>
            <SpendingTrendChart data={spendingTrendData} />
          </div>

          {/* Net Worth */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Net Worth History</h2>
            <p className="text-sm text-gray-500 mb-5">Total portfolio value over time</p>
            <NetWorthChart data={netWorthData} />
          </div>

          {/* Weekly Heatmap */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Weekly Spending Pattern</h2>
            <p className="text-sm text-gray-500 mb-5">Avg daily spend by day of the week</p>
            <SpendingHeatmap data={heatmapData} />
          </div>
        </div>
      </Layout>
    </>
  );
}
