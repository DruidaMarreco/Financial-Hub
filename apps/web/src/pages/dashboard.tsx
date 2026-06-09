import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { useAccounts } from '../hooks/useAccounts'
import { BankConnectionModal } from '../components/BankConnectionModal'
import { useState } from 'react'

interface Transaction {
  id: string
  date: string
  merchant: string
  amount: number
  category: string
  description: string
}

interface RichAccount {
  id: string
  name: string
  balance: number
  currency: string
  institution: string
  icon: string
  type: string
  transactions?: Transaction[]
  monthlySpend?: number
  balanceHistory?: Array<{ date: string; balance: number }>
}

interface RichTx extends Transaction {
  accountName: string
  accountIcon: string
  accountId: string
}

function emojiFor(cat: string) {
  const m: Record<string, string> = {
    groceries: '🛒', dining: '🍽️', coffee: '☕', transport: '🚌',
    entertainment: '🎬', shopping: '🛍️', healthcare: '💊', utilities: '💡',
    income: '💰', savings: '💾',
  }
  return m[cat?.toLowerCase()] ?? '💳'
}

function eur(n: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n)
}

function timeGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth()
  const { accounts, loading: accountsLoading, error: accountsError, loadAccounts } = useAccounts()
  const [showBankModal, setShowBankModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) router.push('/signin')
  }, [authLoading, isAuthenticated, router])

  if (authLoading || accountsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          <p className="mt-4 text-gray-600">Loading…</p>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) return null

  // ── Computed metrics ─────────────────────────────────────────────────────────
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0)

  const allTxs: RichTx[] = accounts.flatMap((a) =>
    (a.transactions || []).map((tx) => ({
      ...tx,
      accountName: a.name,
      accountIcon: a.icon,
      accountId: a.id,
    }))
  )

  const now = new Date()
  const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  const curTxs = allTxs.filter((t) => t.date?.startsWith(curKey))
  const prevTxs = allTxs.filter((t) => t.date?.startsWith(prevKey))

  const curSpend = curTxs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const prevSpend = prevTxs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const curIncome = curTxs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const savingsRate = curIncome > 0 ? Math.round(((curIncome - curSpend) / curIncome) * 100) : null
  const spendDelta = prevSpend > 0 ? Math.round(((curSpend - prevSpend) / prevSpend) * 100) : null

  const recentTxs = [...allTxs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  // Top categories this month
  const catMap = new Map<string, number>()
  curTxs.filter((t) => t.amount < 0).forEach((t) => {
    const c = t.category || 'other'
    catMap.set(c, (catMap.get(c) ?? 0) + Math.abs(t.amount))
  })
  const topCats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCat = topCats[0]?.[1] || 1

  // ── Empty / onboarding state ──────────────────────────────────────────────────
  if (accounts.length === 0) {
    return (
      <>
        <Head><title>Dashboard - Financial Hub</title></Head>
        <Layout>
          <div className="max-w-2xl mx-auto text-center py-12">
            <div className="text-6xl mb-4">👋</div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-3">
              Welcome, {user?.name?.split(' ')[0]}!
            </h1>
            <p className="text-gray-600 text-lg mb-10">
              Connect your first account to start tracking finances.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
              <button
                onClick={() => setShowBankModal(true)}
                className="p-6 bg-gradient-to-br from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-95 text-left"
              >
                <div className="text-3xl mb-2">🎮</div>
                <p className="font-bold text-lg">Connect Demo Bank</p>
                <p className="text-green-100 text-sm mt-1">90 days of real-looking data — instant, no setup</p>
              </button>
              <Link href="/accounts">
                <div className="p-6 bg-white/80 backdrop-blur-xl border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-2xl hover:shadow-xl transition-all cursor-pointer text-left">
                  <div className="text-3xl mb-2">➕</div>
                  <p className="font-bold text-lg text-gray-900">Add Account Manually</p>
                  <p className="text-gray-500 text-sm mt-1">Enter your balance and track it yourself</p>
                </div>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
              {[
                { icon: '📊', title: 'Real Dashboard', desc: 'Net worth, spending trends, and savings rate computed from your actual data' },
                { icon: '🤖', title: 'Smart Insights', desc: 'Automatic categorization, recurring detection, and month-over-month analysis' },
                { icon: '📉', title: 'Visual Charts', desc: 'SVG area charts, category breakdowns, and weekly spending heatmap' },
              ].map((f) => (
                <div key={f.title} className="p-5 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20">
                  <div className="text-2xl mb-2">{f.icon}</div>
                  <p className="font-semibold text-gray-900 mb-1">{f.title}</p>
                  <p className="text-sm text-gray-600">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <BankConnectionModal
            isOpen={showBankModal}
            onClose={() => setShowBankModal(false)}
            onSuccess={() => { setShowBankModal(false); loadAccounts() }}
          />
        </Layout>
      </>
    )
  }

  // ── Full dashboard ────────────────────────────────────────────────────────────
  return (
    <>
      <Head><title>Dashboard - Financial Hub</title></Head>
      <Layout>
        <div className="space-y-8">

          {/* Greeting */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {timeGreeting()}, {user?.name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-gray-500 mt-1">Here's your financial overview</p>
            </div>
            <button
              onClick={() => setShowBankModal(true)}
              className="self-start sm:self-auto px-5 py-2.5 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all active:scale-95 shadow-md text-sm"
            >
              🔗 Connect Account
            </button>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Net Worth */}
            <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
              <p className="text-blue-100 text-sm font-medium mb-1">💰 Net Worth</p>
              <p className="text-3xl font-bold">{eur(totalBalance)}</p>
              <p className="text-blue-200 text-xs mt-2">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
            </div>

            {/* This Month Spending */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-sm">
              <p className="text-gray-500 text-sm font-medium mb-1">💸 This Month</p>
              <p className="text-2xl font-bold text-gray-900">{eur(curSpend)}</p>
              {spendDelta !== null && (
                <p className={`text-xs mt-2 font-semibold ${spendDelta > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {spendDelta > 0 ? `↑ ${spendDelta}% vs last month` : `↓ ${Math.abs(spendDelta)}% vs last month`}
                </p>
              )}
            </div>

            {/* This Month Income */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-sm">
              <p className="text-gray-500 text-sm font-medium mb-1">💰 Income</p>
              <p className="text-2xl font-bold text-gray-900">{curIncome > 0 ? eur(curIncome) : '—'}</p>
              <p className="text-gray-400 text-xs mt-2">This month</p>
            </div>

            {/* Savings Rate */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-sm">
              <p className="text-gray-500 text-sm font-medium mb-1">📈 Savings Rate</p>
              <p className={`text-2xl font-bold ${savingsRate !== null ? (savingsRate >= 20 ? 'text-emerald-600' : savingsRate >= 0 ? 'text-yellow-600' : 'text-red-500') : 'text-gray-900'}`}>
                {savingsRate !== null ? `${savingsRate}%` : '—'}
              </p>
              <p className="text-gray-400 text-xs mt-2">{savingsRate !== null && savingsRate >= 20 ? '🎉 On track!' : savingsRate !== null && savingsRate < 0 ? '⚠️ Over budget' : 'This month'}</p>
            </div>
          </div>

          {/* Two-column: recent txs + accounts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Recent Transactions (2/3 width) */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Recent Transactions</h2>
                <Link href="/transactions" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View all →
                </Link>
              </div>
              {recentTxs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">No transactions yet</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentTxs.map((tx) => (
                    <div key={`${tx.accountId}-${tx.id}`} className="flex items-center gap-3 px-6 py-3 hover:bg-gray-50/50 transition-colors">
                      <span className="text-xl flex-shrink-0">{emojiFor(tx.category)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{tx.merchant}</p>
                        <p className="text-xs text-gray-400 truncate">{tx.date} · {tx.accountName}</p>
                      </div>
                      <span className={`text-sm font-bold tabular-nums flex-shrink-0 ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {tx.amount >= 0 ? '+' : ''}{eur(tx.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account list (1/3 width) */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">Accounts</h2>
                <Link href="/accounts" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Manage →
                </Link>
              </div>
              <div className="divide-y divide-gray-50">
                {accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                    <span className="text-2xl">{acc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{acc.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{acc.institution}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900 tabular-nums flex-shrink-0">
                      {eur(acc.balance)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Total</span>
                  <span className="font-bold text-gray-900">{eur(totalBalance)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* This month spending breakdown */}
          {topCats.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900">This Month's Spending</h2>
                <Link href="/analytics" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  Full analytics →
                </Link>
              </div>
              <div className="space-y-3">
                {topCats.map(([cat, amount]) => (
                  <div key={cat} className="flex items-center gap-3">
                    <span className="text-lg w-7 flex-shrink-0">{emojiFor(cat)}</span>
                    <span className="text-sm text-gray-700 capitalize w-24 flex-shrink-0">{cat}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                        style={{ width: `${(amount / maxCat) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 w-20 text-right flex-shrink-0 tabular-nums">
                      {eur(amount)}
                    </span>
                  </div>
                ))}
              </div>
              {curSpend > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between text-sm">
                  <span className="text-gray-500">Total spent this month</span>
                  <span className="font-bold text-gray-900">{eur(curSpend)}</span>
                </div>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { href: '/transactions', icon: '➕', label: 'Add Transaction', color: 'from-blue-500 to-blue-600' },
              { href: '/visualizations', icon: '📉', label: 'View Charts', color: 'from-purple-500 to-purple-600' },
              { href: '/insights', icon: '🤖', label: 'AI Insights', color: 'from-indigo-500 to-indigo-600' },
              { href: '/settings', icon: '⚙️', label: 'Settings', color: 'from-gray-500 to-gray-600' },
            ].map((a) => (
              <Link key={a.href} href={a.href}>
                <div className={`p-4 bg-gradient-to-br ${a.color} rounded-xl text-white hover:shadow-lg transition-all active:scale-95 cursor-pointer text-center`}>
                  <div className="text-2xl mb-1">{a.icon}</div>
                  <p className="text-sm font-semibold">{a.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <BankConnectionModal
          isOpen={showBankModal}
          onClose={() => setShowBankModal(false)}
          onSuccess={() => { setShowBankModal(false); loadAccounts() }}
        />
      </Layout>
    </>
  )
}
