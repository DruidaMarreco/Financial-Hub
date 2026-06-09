import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
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
  balance: number
  monthlySpend: number
  transactions?: Transaction[]
}

export default function InsightsPage() {
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

  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const currentMonth = `${today.getFullYear()}-${pad(today.getMonth() + 1)}`
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastMonth = `${lastMonthDate.getFullYear()}-${pad(lastMonthDate.getMonth() + 1)}`

  const allTxs: Transaction[] = accounts.flatMap((a) => a.transactions || [])

  const currentMonthTxs = allTxs.filter(
    (t) => t.date?.startsWith(currentMonth) && t.amount < 0
  )
  const lastMonthTxs = allTxs.filter(
    (t) => t.date?.startsWith(lastMonth) && t.amount < 0
  )
  const currentMonthIncome = allTxs
    .filter((t) => t.date?.startsWith(currentMonth) && t.amount > 0)
    .reduce((s, t) => s + t.amount, 0)

  const currentSpend = currentMonthTxs.reduce((s, t) => s + Math.abs(t.amount), 0)
  const lastSpend = lastMonthTxs.reduce((s, t) => s + Math.abs(t.amount), 0)

  const savingsRate =
    currentMonthIncome > 0
      ? Math.round(((currentMonthIncome - currentSpend) / currentMonthIncome) * 100)
      : 0

  // Top category
  const categoryTotals: Record<string, number> = {}
  for (const t of currentMonthTxs) {
    if (t.category) {
      categoryTotals[t.category] = (categoryTotals[t.category] ?? 0) + Math.abs(t.amount)
    }
  }
  const topCategoryEntry = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]

  // Largest expense
  const largestExpense = currentMonthTxs.reduce<Transaction | null>(
    (max, t) => (max === null || Math.abs(t.amount) > Math.abs(max.amount) ? t : max),
    null
  )

  // Recurring merchants (appear in both months)
  const currentMerchants = new Set(currentMonthTxs.map((t) => t.merchant))
  const lastMerchants = new Set(lastMonthTxs.map((t) => t.merchant))
  const recurringMerchants = [...currentMerchants].filter((m) => lastMerchants.has(m))

  const spendChange =
    lastSpend > 0 ? Math.round(((currentSpend - lastSpend) / lastSpend) * 100) : 0

  const dayOfMonth = today.getDate()
  const avgDailySpend = dayOfMonth > 0 ? currentSpend / dayOfMonth : 0

  const coffeeSpend = currentMonthTxs
    .filter((t) => t.category === 'coffee')
    .reduce((s, t) => s + Math.abs(t.amount), 0)
  const diningSpend = currentMonthTxs
    .filter((t) => t.category === 'dining')
    .reduce((s, t) => s + Math.abs(t.amount), 0)
  const groceriesSpend = currentMonthTxs
    .filter((t) => t.category === 'groceries')
    .reduce((s, t) => s + Math.abs(t.amount), 0)

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n)

  if (allTxs.length === 0) {
    return (
      <Layout title="AI Insights">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
            <p className="text-gray-500 mt-1">Smart analysis of your spending patterns</p>
          </div>
          <div className="mt-8 bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
            <div className="text-5xl mb-4">💡</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Data Yet
            </h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              Connect your accounts to unlock insights. Once you have transaction data,
              we&apos;ll surface spending trends, savings opportunities, and personalised tips.
            </p>
            <Link
              href="/accounts"
              className="inline-block px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Connect your accounts
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  const insightCards = [
    {
      emoji: '💰',
      title: 'Top Category',
      value: topCategoryEntry ? topCategoryEntry[0] : 'N/A',
      sub: topCategoryEntry ? `${fmt(topCategoryEntry[1])} spent` : 'No data',
      gradient: 'from-orange-500 to-pink-500',
    },
    {
      emoji: '📊',
      title: 'Savings Rate',
      value: `${savingsRate}%`,
      sub: 'of income saved',
      gradient: 'from-emerald-500 to-teal-600',
    },
    {
      emoji: '🏆',
      title: 'Largest Expense',
      value: largestExpense ? largestExpense.merchant : 'N/A',
      sub: largestExpense ? fmt(Math.abs(largestExpense.amount)) : '—',
      gradient: 'from-red-500 to-rose-600',
    },
    {
      emoji: '🔄',
      title: 'Recurring',
      value: `${recurringMerchants.length} subscriptions`,
      sub: 'seen last month too',
      gradient: 'from-purple-500 to-indigo-600',
    },
    {
      emoji: '📈',
      title: 'vs Last Month',
      value: `${spendChange > 0 ? '+' : ''}${spendChange}%`,
      sub: spendChange === 0 ? 'No change' : spendChange > 0 ? 'more spent' : 'less spent',
      gradient:
        spendChange <= 0
          ? 'from-emerald-500 to-teal-600'
          : 'from-red-500 to-rose-600',
    },
    {
      emoji: '☕',
      title: 'Daily Average',
      value: `${fmt(avgDailySpend)}/day`,
      sub: `${fmt(currentSpend)} this month`,
      gradient: 'from-blue-500 to-purple-600',
    },
  ]

  // Tips
  const tips: { emoji: string; title: string; body: string }[] = []

  if (coffeeSpend > 40) {
    const homeSaving = Math.round(coffeeSpend * 0.7)
    tips.push({
      emoji: '☕',
      title: 'Coffee Habit',
      body: `You're spending ${fmt(coffeeSpend)}/mo on coffee. Brewing at home could save you ${fmt(homeSaving)}/mo.`,
    })
  }

  if (diningSpend > groceriesSpend) {
    const potentialSaving = Math.round((diningSpend - groceriesSpend) * 0.4)
    tips.push({
      emoji: '🍽️',
      title: 'Dining vs Groceries',
      body: `You spend more dining out than on groceries. Meal prepping could save ${fmt(potentialSaving)}/mo.`,
    })
  }

  if (savingsRate >= 20) {
    tips.push({
      emoji: '🌟',
      title: 'Great Savings',
      body: `You're saving ${savingsRate}% of your income this month. Keep it up!`,
    })
  } else if (savingsRate > 0) {
    tips.push({
      emoji: '💡',
      title: 'Savings Opportunity',
      body: `You're saving ${savingsRate}% this month. Try to target 20% for financial security.`,
    })
  } else {
    tips.push({
      emoji: '💡',
      title: 'Savings Opportunity',
      body: `No savings detected this month. Review your subscriptions and discretionary spending.`,
    })
  }

  return (
    <Layout title="AI Insights">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-gray-500 mt-1">Smart analysis of your spending patterns</p>
        </div>

        {/* 2x3 insight cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {insightCards.map((card) => (
            <div
              key={card.title}
              className={`bg-gradient-to-br ${card.gradient} p-6 rounded-2xl text-white`}
            >
              <p className="text-white/80 text-sm font-medium">
                {card.emoji} {card.title}
              </p>
              <p className="text-2xl font-bold mt-2 leading-tight">{card.value}</p>
              <p className="text-white/70 text-xs mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Tips section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Personalised Tips</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {tips.map((tip) => (
              <div
                key={tip.title}
                className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
              >
                <p className="text-2xl mb-2">{tip.emoji}</p>
                <h3 className="font-semibold text-gray-900 mb-1">{tip.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{tip.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
