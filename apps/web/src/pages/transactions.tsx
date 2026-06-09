import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'

interface Transaction {
  id: string
  date: string
  merchant: string
  amount: number
  category: string
  description: string
}

interface Account {
  id: string
  name: string
  transactions?: Transaction[]
}

type SortOrder = 'newest' | 'oldest' | 'highest' | 'lowest'

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    groceries: '🛒',
    dining: '🍽️',
    coffee: '☕',
    transport: '🚌',
    entertainment: '🎬',
    shopping: '🛍️',
    healthcare: '💊',
    utilities: '💡',
    income: '💰',
    savings: '💾',
  }
  return map[category?.toLowerCase()] ?? '💳'
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(
    Math.abs(amount)
  )
}

export default function TransactionsPage() {
  const router = useRouter()
  const { loading, isAuthenticated } = useAuth()

  const [accounts, setAccounts] = useState<Account[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')

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

  const allTxs: Transaction[] = accounts.flatMap((a) => a.transactions || [])

  const categories = [
    'all',
    ...Array.from(new Set(allTxs.map((t) => t.category).filter(Boolean))),
  ]

  const filtered = allTxs
    .filter((t) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        !searchTerm ||
        (t.merchant?.toLowerCase() ?? '').includes(term) ||
        (t.description?.toLowerCase() ?? '').includes(term)
      const matchesCategory =
        selectedCategory === 'all' || t.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortOrder === 'newest')
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortOrder === 'oldest')
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sortOrder === 'highest') return Math.abs(b.amount) - Math.abs(a.amount)
      if (sortOrder === 'lowest') return Math.abs(a.amount) - Math.abs(b.amount)
      return 0
    })

  const totalSpending = allTxs
    .filter((t) => t.amount < 0)
    .reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalIncome = allTxs
    .filter((t) => t.amount > 0)
    .reduce((s, t) => s + t.amount, 0)

  return (
    <Layout title="Transactions">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 mt-1">All your transactions across accounts</p>
        </div>

        {/* Summary metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-2xl text-white">
            <p className="text-blue-100 text-sm font-medium">Total Transactions</p>
            <p className="text-3xl font-bold mt-1">{allTxs.length}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-pink-600 p-6 rounded-2xl text-white">
            <p className="text-red-100 text-sm font-medium">Total Spending</p>
            <p className="text-3xl font-bold mt-1">
              {new Intl.NumberFormat('en-IE', {
                style: 'currency',
                currency: 'EUR',
              }).format(totalSpending)}
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl text-white">
            <p className="text-emerald-100 text-sm font-medium">Total Income</p>
            <p className="text-3xl font-bold mt-1">
              {new Intl.NumberFormat('en-IE', {
                style: 'currency',
                currency: 'EUR',
              }).format(totalIncome)}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/20 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search merchant or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl border border-gray-200 bg-white/70 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all'
                  ? 'All Categories'
                  : `${getCategoryEmoji(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
              </option>
            ))}
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as SortOrder)}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>
        </div>

        {/* Transaction list / empty states */}
        {allTxs.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
            <div className="text-5xl mb-4">💳</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Transactions Yet</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Your transaction history will appear here once your accounts are connected and
              have transaction data.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h2>
            <p className="text-gray-500 text-sm">
              Try adjusting your search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filtered.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/60 transition-colors"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-2xl flex-shrink-0">
                      {getCategoryEmoji(tx.category)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{tx.merchant}</p>
                      {tx.description && (
                        <p className="text-xs text-gray-500 truncate">{tx.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">{tx.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium capitalize">
                      {tx.category}
                    </span>
                    <span
                      className={`text-base font-semibold tabular-nums ${
                        tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {tx.amount >= 0 ? '+' : '-'}
                      {formatCurrency(tx.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
