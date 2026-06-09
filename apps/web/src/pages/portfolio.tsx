import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'

interface BalancePoint {
  date: string
  balance: number
}

interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  institution: string
  icon: string
  balanceHistory: BalancePoint[]
}

function formatCurrency(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(amount)
}

function balanceGrowth(account: Account): number | null {
  const history = account.balanceHistory
  if (!history || history.length < 2) return null
  return history[history.length - 1].balance - history[0].balance
}

export default function PortfolioPage() {
  const router = useRouter()
  const { loading, isAuthenticated } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/signin')
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user_accounts')
      if (raw) setAccounts(JSON.parse(raw))
    } catch {
      setAccounts([])
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  if (!isAuthenticated) return null

  const investmentAccounts = accounts.filter((a) => a.type === 'investment')
  const savingsAccounts = accounts.filter((a) => a.type === 'savings')
  const checkingAccounts = accounts.filter(
    (a) => a.type === 'checking' || a.type === 'meal-card'
  )

  const totalNetWorth = accounts.reduce((s, a) => s + (a.balance ?? 0), 0)
  const totalInvestments = investmentAccounts.reduce((s, a) => s + (a.balance ?? 0), 0)
  const totalSavings = savingsAccounts.reduce((s, a) => s + (a.balance ?? 0), 0)
  const totalOther = checkingAccounts.reduce((s, a) => s + (a.balance ?? 0), 0)

  const assetBreakdown = [
    {
      label: 'Investments',
      total: totalInvestments,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      label: 'Savings',
      total: totalSavings,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Other',
      total: totalOther,
      color: 'bg-purple-400',
      textColor: 'text-purple-600',
    },
  ].filter((b) => b.total > 0)

  return (
    <Layout title="Portfolio & Wealth">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Portfolio & Wealth</h1>
          <p className="text-gray-500 mt-1">Your complete financial picture</p>
        </div>

        {/* Net Worth summary card */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-2xl text-white">
          <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">
            Total Net Worth
          </p>
          <p className="text-5xl font-bold mt-2">
            {formatCurrency(totalNetWorth)}
          </p>
          <p className="text-blue-200 text-sm mt-2">
            Across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Asset breakdown */}
        {assetBreakdown.length > 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Asset Breakdown</h2>
            <div className="space-y-5">
              {assetBreakdown.map((item) => {
                const pct =
                  totalNetWorth > 0
                    ? Math.round((item.total / totalNetWorth) * 100)
                    : 0
                return (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-700">
                        {item.label}
                      </span>
                      <span className={`text-sm font-semibold ${item.textColor}`}>
                        {formatCurrency(item.total)} &middot; {pct}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${item.color} transition-all duration-700`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Investments section */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Investments</h2>
          {investmentAccounts.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
              <div className="text-5xl mb-4">📈</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Investment Accounts
              </h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
                Add investment accounts (brokerage, ETF portfolios, pension funds, crypto
                wallets) to track your portfolio performance here.
              </p>
              <Link
                href="/accounts"
                className="inline-block px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Add an Account
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {investmentAccounts.map((acc) => {
                const growth = balanceGrowth(acc)
                return (
                  <div
                    key={acc.id}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{acc.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{acc.name}</p>
                        <p className="text-xs text-gray-500">{acc.institution}</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(acc.balance, acc.currency)}
                    </p>
                    {growth !== null && (
                      <p
                        className={`text-sm mt-1 font-medium ${
                          growth >= 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {growth >= 0 ? '+' : ''}
                        {formatCurrency(growth, acc.currency)} all-time
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Savings section */}
        {savingsAccounts.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Savings</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {savingsAccounts.map((acc) => {
                const growth = balanceGrowth(acc)
                return (
                  <div
                    key={acc.id}
                    className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{acc.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-900">{acc.name}</p>
                        <p className="text-xs text-gray-500">{acc.institution}</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(acc.balance, acc.currency)}
                    </p>
                    {growth !== null && (
                      <p
                        className={`text-sm mt-1 font-medium ${
                          growth >= 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}
                      >
                        {growth >= 0 ? '+' : ''}
                        {formatCurrency(growth, acc.currency)} growth
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Other accounts section */}
        {checkingAccounts.length > 0 && (
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Other Accounts</h2>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {checkingAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center justify-between px-6 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{acc.icon}</span>
                      <div>
                        <p className="font-medium text-gray-900">{acc.name}</p>
                        <p className="text-xs text-gray-500 capitalize">
                          {acc.type} &middot; {acc.institution}
                        </p>
                      </div>
                    </div>
                    <p className="text-base font-semibold text-gray-900">
                      {formatCurrency(acc.balance, acc.currency)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Fully empty state */}
        {accounts.length === 0 && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
            <div className="text-5xl mb-4">💼</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Accounts Yet</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-4">
              Add your accounts to see your portfolio and net worth.
            </p>
            <Link
              href="/accounts"
              className="inline-block px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Add Accounts
            </Link>
          </div>
        )}
      </div>
    </Layout>
  )
}
