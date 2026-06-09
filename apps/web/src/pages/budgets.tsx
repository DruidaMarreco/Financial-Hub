import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'

const CATEGORY_OPTIONS = [
  { value: 'groceries',    emoji: '🛒', label: 'Groceries' },
  { value: 'dining',       emoji: '🍽️', label: 'Dining Out' },
  { value: 'coffee',       emoji: '☕', label: 'Coffee' },
  { value: 'transport',    emoji: '🚌', label: 'Transport' },
  { value: 'entertainment',emoji: '🎬', label: 'Entertainment' },
  { value: 'shopping',     emoji: '🛍️', label: 'Shopping' },
  { value: 'healthcare',   emoji: '💊', label: 'Healthcare' },
  { value: 'utilities',    emoji: '💡', label: 'Utilities' },
  { value: 'other',        emoji: '💳', label: 'Other' },
]

interface Budget {
  id: string
  category: string
  monthlyLimit: number
}

interface Recurring {
  id: string
  merchant: string
  amount: number
  category: string
  accountId: string
  dayOfMonth: number   // 1–28
  isIncome: boolean
  active: boolean
  lastApplied: string  // 'YYYY-MM' or ''
}

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
  type: string
  icon: string
  transactions?: Transaction[]
}

const BUDGETS_KEY    = 'user_budgets'
const RECURRING_KEY  = 'user_recurring'

function eur(n: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(Math.abs(n))
}

function meta(cat: string) {
  return CATEGORY_OPTIONS.find(c => c.value === cat) ?? {
    emoji: '💳',
    label: cat.charAt(0).toUpperCase() + cat.slice(1),
    value: cat,
  }
}

function BudgetBar({ spent, limit }: { spent: number; limit: number }) {
  const pct = limit > 0 ? (spent / limit) * 100 : 0
  const bar  = pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-yellow-500' : 'bg-emerald-500'
  const bg   = pct >= 100 ? 'bg-red-100' : pct >= 80 ? 'bg-yellow-100' : 'bg-emerald-100'
  return (
    <div className={`w-full h-2.5 ${bg} rounded-full overflow-hidden`}>
      <div className={`h-full ${bar} rounded-full transition-all duration-500`} style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  )
}

interface IncomeForm {
  merchant: string; amount: string; date: string; accountId: string
}

export default function BudgetsPage() {
  const { loading, isAuthenticated } = useAuth()
  const router = useRouter()

  const [accounts, setAccounts]           = useState<Account[]>([])
  const [budgets, setBudgets]             = useState<Budget[]>([])
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [newCategory, setNewCategory]     = useState('groceries')
  const [newLimit, setNewLimit]           = useState('')
  const [showIncomeModal, setShowIncomeModal] = useState(false)
  const [incomeForm, setIncomeForm]       = useState<IncomeForm>({
    merchant: '', amount: '', date: new Date().toISOString().slice(0, 10), accountId: '',
  })
  const [recurring, setRecurring]         = useState<Recurring[]>([])
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [appliedCount, setAppliedCount]   = useState(0)
  const [recurringForm, setRecurringForm] = useState<Omit<Recurring, 'id' | 'lastApplied'>>({
    merchant: '', amount: 0, category: 'income', accountId: '', dayOfMonth: 1, isIncome: true, active: true,
  })

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/signin')
  }, [loading, isAuthenticated, router])

  const reload = () => {
    try {
      const a = localStorage.getItem('user_accounts')
      if (a) setAccounts(JSON.parse(a))
      const b = localStorage.getItem(BUDGETS_KEY)
      if (b) setBudgets(JSON.parse(b))
      const r = localStorage.getItem(RECURRING_KEY)
      if (r) setRecurring(JSON.parse(r))
    } catch { /* ignore */ }
  }

  useEffect(() => { reload() }, [])

  // Auto-apply recurring transactions once per month on or after their due day
  useEffect(() => {
    if (accounts.length === 0) return
    try {
      const rawR = localStorage.getItem(RECURRING_KEY)
      if (!rawR) return
      const rules: Recurring[] = JSON.parse(rawR)
      const rawA = localStorage.getItem('user_accounts')
      if (!rawA) return
      const accs: Account[] = JSON.parse(rawA)

      const now = new Date()
      const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      const today  = now.getDate()

      let applied = 0
      const updatedRules = rules.map(r => {
        if (!r.active) return r
        if (r.lastApplied === curKey) return r   // already applied this month
        if (today < r.dayOfMonth) return r        // not due yet this month
        return { ...r, lastApplied: curKey }
      })

      // Build new transactions
      const newTxsByAccount = new Map<string, Transaction>()
      rules.forEach((r, i) => {
        const updated = updatedRules[i]
        if (updated.lastApplied === curKey && r.lastApplied !== curKey) {
          const dueDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(r.dayOfMonth).padStart(2, '0')}`
          newTxsByAccount.set(r.accountId, {
            id: `rec-${r.id}-${curKey}`,
            date: dueDate,
            merchant: r.merchant,
            amount: r.isIncome ? Math.abs(r.amount) : -Math.abs(r.amount),
            category: r.category,
            description: '🔄 Recurring',
          })
          applied++
        }
      })

      if (applied === 0) return

      const updatedAccounts = accs.map(a => {
        const newTx = newTxsByAccount.get(a.id)
        if (!newTx) return a
        // Don't duplicate if it already exists
        const alreadyExists = (a.transactions || []).some(t => t.id === newTx.id)
        if (alreadyExists) return a
        return { ...a, transactions: [newTx, ...(a.transactions || [])] }
      })

      localStorage.setItem('user_accounts', JSON.stringify(updatedAccounts))
      localStorage.setItem(RECURRING_KEY, JSON.stringify(updatedRules))
      setAccounts(updatedAccounts)
      setRecurring(updatedRules)
      setAppliedCount(applied)
      setTimeout(() => setAppliedCount(0), 4000)
    } catch { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.length])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )
  if (!isAuthenticated) return null

  // ── Current month ───────────────────────────────────────────────────────────
  const now = new Date()
  const curKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`

  // Scope to checking + savings (not meal cards)
  const trackable = accounts.filter(a => a.type === 'checking' || a.type === 'savings')
  const thisMo = trackable.flatMap(a =>
    (a.transactions || [])
      .filter(tx => tx.date?.startsWith(curKey))
      .map(tx => ({ ...tx, accountName: a.name, accountIcon: a.icon }))
  )

  const todayIso = now.toISOString().slice(0, 10)
  const allIncomeTxs = [...thisMo.filter(tx => tx.amount > 0)].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  // Confirmed = already occurred (date ≤ today); Projected = future-dated
  const incomeTxs      = allIncomeTxs.filter(tx => tx.date <= todayIso)
  const projectedTxs   = allIncomeTxs.filter(tx => tx.date >  todayIso)
  const expenseTxs     = thisMo.filter(tx => tx.amount < 0)

  const totalIncome   = incomeTxs.reduce((s, tx) => s + tx.amount, 0)
  const totalExpenses = expenseTxs.reduce((s, tx) => s + Math.abs(tx.amount), 0)
  const netFlow       = totalIncome - totalExpenses

  // Spending by category
  const catMap = new Map<string, number>()
  expenseTxs.forEach(tx => {
    const c = tx.category || 'other'
    catMap.set(c, (catMap.get(c) ?? 0) + Math.abs(tx.amount))
  })

  const budgetedCats = new Set(budgets.map(b => b.category))
  const budgetRows = budgets
    .map(b => ({ ...b, spent: catMap.get(b.category) ?? 0 }))
    .sort((a, b) => (b.spent / b.monthlyLimit) - (a.spent / a.monthlyLimit))

  const unbudgeted = Array.from(catMap.entries())
    .filter(([c]) => !budgetedCats.has(c))
    .sort((a, b) => b[1] - a[1])

  const totalBudgeted         = budgets.reduce((s, b) => s + b.monthlyLimit, 0)
  const totalSpentOnBudgeted  = budgetRows.reduce((s, b) => s + b.spent, 0)
  const overBudgetCount       = budgetRows.filter(b => b.spent > b.monthlyLimit).length

  const saveBudgets = (updated: Budget[]) => {
    setBudgets(updated)
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(updated))
  }

  const handleAddBudget = () => {
    if (!newLimit || !newCategory) return
    const limit = parseFloat(newLimit)
    if (isNaN(limit) || limit <= 0) return
    const existing = budgets.find(b => b.category === newCategory)
    if (existing) {
      saveBudgets(budgets.map(b => b.category === newCategory ? { ...b, monthlyLimit: limit } : b))
    } else {
      saveBudgets([...budgets, { id: `b-${Date.now()}`, category: newCategory, monthlyLimit: limit }])
    }
    setShowBudgetModal(false)
    setNewLimit('')
  }

  const handleSaveEdit = () => {
    if (!editingBudget) return
    const limit = parseFloat(newLimit)
    if (isNaN(limit) || limit <= 0) return
    saveBudgets(budgets.map(b => b.id === editingBudget.id ? { ...b, monthlyLimit: limit } : b))
    setEditingBudget(null)
    setNewLimit('')
  }

  const handleLogIncome = () => {
    const { merchant, amount, date, accountId } = incomeForm
    if (!merchant || !amount || !accountId) return
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date,
      merchant,
      amount: Math.abs(parseFloat(amount)),
      category: 'income',
      description: '',
    }
    const updated = accounts.map(a =>
      a.id === accountId ? { ...a, transactions: [newTx, ...(a.transactions || [])] } : a
    )
    localStorage.setItem('user_accounts', JSON.stringify(updated))
    setAccounts(updated)
    setShowIncomeModal(false)
    setIncomeForm({ merchant: '', amount: '', date: new Date().toISOString().slice(0, 10), accountId: accountId })
  }

  const saveRecurring = (updated: Recurring[]) => {
    setRecurring(updated)
    localStorage.setItem(RECURRING_KEY, JSON.stringify(updated))
  }

  const handleAddRecurring = () => {
    const { merchant, amount, category, accountId, dayOfMonth, isIncome, active } = recurringForm
    if (!merchant || !amount || !accountId) return
    const rule: Recurring = {
      id: `rec-${Date.now()}`, merchant, amount: parseFloat(String(amount)),
      category, accountId, dayOfMonth, isIncome, active, lastApplied: '',
    }
    saveRecurring([...recurring, rule])
    setShowRecurringModal(false)
    setRecurringForm({ merchant: '', amount: 0, category: 'income', accountId: '', dayOfMonth: 1, isIncome: true, active: true })
  }

  const toggleRecurring = (id: string) =>
    saveRecurring(recurring.map(r => r.id === id ? { ...r, active: !r.active } : r))

  const deleteRecurring = (id: string) =>
    saveRecurring(recurring.filter(r => r.id !== id))

  const checkingAccounts = accounts.filter(a => a.type === 'checking' || a.type === 'savings')

  return (
    <>
      <Head><title>Budgets - Financial Hub</title></Head>
      <Layout title="Budgets & Income">
        {/* Auto-apply toast */}
        {appliedCount > 0 && (
          <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce-once text-sm font-semibold">
            🔄 Applied {appliedCount} recurring transaction{appliedCount !== 1 ? 's' : ''}
          </div>
        )}

        <div className="max-w-3xl space-y-8">
          <p className="text-gray-500 -mt-6 text-sm">{monthLabel}</p>

          {/* ── Summary cards ────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-5 shadow-sm">
              <p className="text-emerald-100 text-xs font-semibold mb-1">💰 Income</p>
              <p className="text-2xl font-bold text-white">{totalIncome > 0 ? eur(totalIncome) : '—'}</p>
              <p className="text-emerald-200 text-xs mt-1">
                {incomeTxs.length} confirmed{projectedTxs.length > 0 ? ` · ${projectedTxs.length} projected` : ''}
              </p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl p-5 shadow-sm">
              <p className="text-red-100 text-xs font-semibold mb-1">💸 Expenses</p>
              <p className="text-2xl font-bold text-white">{totalExpenses > 0 ? eur(totalExpenses) : '—'}</p>
              <p className="text-red-200 text-xs mt-1">{expenseTxs.length} transaction{expenseTxs.length !== 1 ? 's' : ''}</p>
            </div>
            <div className={`bg-gradient-to-br ${netFlow >= 0 ? 'from-blue-500 to-purple-600' : 'from-orange-500 to-red-500'} rounded-2xl p-5 shadow-sm`}>
              <p className="text-white/80 text-xs font-semibold mb-1">📊 Net Flow</p>
              <p className="text-2xl font-bold text-white">{netFlow >= 0 ? '+' : '-'}{eur(netFlow)}</p>
              <p className="text-white/60 text-xs mt-1">{netFlow >= 0 ? 'Surplus' : 'Deficit'}</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-sm">
              <p className="text-gray-500 text-xs font-semibold mb-1">🎯 Budget Status</p>
              <p className={`text-2xl font-bold ${overBudgetCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {budgets.length === 0 ? '—' : overBudgetCount > 0 ? `${overBudgetCount} over` : '✓ On track'}
              </p>
              <p className="text-gray-400 text-xs mt-1">
                {totalBudgeted > 0 ? `${eur(totalSpentOnBudgeted)} / ${eur(totalBudgeted)}` : `${budgets.length} budgets`}
              </p>
            </div>
          </div>

          {/* ── Income section ───────────────────────────────────────────── */}
          <section className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">💰 Income — {monthLabel}</h2>
                <p className="text-xs text-gray-400 mt-0.5">From checking &amp; savings accounts</p>
              </div>
              <button
                onClick={() => {
                  setIncomeForm(f => ({ ...f, accountId: checkingAccounts[0]?.id || accounts[0]?.id || '' }))
                  setShowIncomeModal(true)
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl text-sm transition-all active:scale-95 shadow-sm"
              >
                + Log Income
              </button>
            </div>

            {allIncomeTxs.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="text-4xl mb-3">💰</div>
                <p className="font-semibold text-gray-800 mb-1">No income recorded this month</p>
                <p className="text-sm text-gray-500 mb-5">Log your salary, freelance payments, or any other income to track your savings rate.</p>
                <button
                  onClick={() => {
                    setIncomeForm(f => ({ ...f, accountId: checkingAccounts[0]?.id || accounts[0]?.id || '' }))
                    setShowIncomeModal(true)
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl text-sm active:scale-95 transition-all shadow-sm"
                >
                  + Log Your First Income
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {/* Confirmed income */}
                {incomeTxs.map(tx => (
                  <div key={tx.id} className="flex items-center gap-4 px-6 py-3">
                    <span className="text-2xl">💰</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{tx.merchant}</p>
                      <p className="text-xs text-gray-400">{tx.date} · {tx.accountName}</p>
                    </div>
                    <span className="text-base font-bold text-emerald-600 tabular-nums">+{eur(tx.amount)}</span>
                  </div>
                ))}

                {/* Projected (future-dated) income */}
                {projectedTxs.length > 0 && (
                  <>
                    <div className="px-6 py-2 bg-blue-50/60 flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-700 uppercase tracking-wide">🔮 Projected Income</span>
                      <span className="text-xs text-blue-500">· future-dated, not yet received</span>
                    </div>
                    {projectedTxs.map(tx => (
                      <div key={tx.id} className="flex items-center gap-4 px-6 py-3 bg-blue-50/30 border-l-4 border-blue-300">
                        <span className="text-2xl opacity-60">🔮</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-blue-800 truncate">{tx.merchant}</p>
                          <p className="text-xs text-blue-400">{tx.date} · {tx.accountName} · projected</p>
                        </div>
                        <span className="text-base font-bold text-blue-600 tabular-nums opacity-75">+{eur(tx.amount)}</span>
                      </div>
                    ))}
                  </>
                )}

                <div className="px-6 py-3 bg-emerald-50/60 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-semibold text-gray-700">Confirmed income</span>
                    {projectedTxs.length > 0 && (
                      <p className="text-xs text-blue-500">+{eur(projectedTxs.reduce((s, t) => s + t.amount, 0))} projected</p>
                    )}
                  </div>
                  <span className="text-lg font-bold text-emerald-700 tabular-nums">+{eur(totalIncome)}</span>
                </div>
              </div>
            )}
          </section>

          {/* ── Budget tracking ──────────────────────────────────────────── */}
          <section className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">🎯 Monthly Budgets</h2>
                {budgets.length > 0 && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {eur(totalSpentOnBudgeted)} spent of {eur(totalBudgeted)} budgeted
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowBudgetModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl text-sm transition-all active:scale-95 shadow-sm"
              >
                + Set Budget
              </button>
            </div>

            {budgets.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="text-4xl mb-3">🎯</div>
                <p className="font-semibold text-gray-800 mb-1">No budgets set yet</p>
                <p className="text-sm text-gray-500 mb-5">Set monthly limits per category to see where you're over- or under-spending.</p>
                <button
                  onClick={() => setShowBudgetModal(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl text-sm active:scale-95 transition-all shadow-sm"
                >
                  + Set Your First Budget
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {budgetRows.map(b => {
                  const m = meta(b.category)
                  const pct = b.monthlyLimit > 0 ? Math.round((b.spent / b.monthlyLimit) * 100) : 0
                  const remaining = b.monthlyLimit - b.spent
                  const isEditing = editingBudget?.id === b.id

                  return (
                    <div key={b.id} className="px-6 py-4">
                      <div className="flex items-center gap-3 mb-2.5">
                        <span className="text-xl w-7 flex-shrink-0">{m.emoji}</span>
                        <span className="font-semibold text-gray-900 flex-1">{m.label}</span>

                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">€</span>
                            <input
                              type="number"
                              value={newLimit}
                              onChange={e => setNewLimit(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveEdit()
                                if (e.key === 'Escape') { setEditingBudget(null); setNewLimit('') }
                              }}
                              className="w-24 px-2 py-1 border-2 border-blue-400 rounded-lg text-sm focus:outline-none"
                              autoFocus
                            />
                            <button onClick={handleSaveEdit} className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold">✓</button>
                            <button onClick={() => { setEditingBudget(null); setNewLimit('') }} className="px-2 py-1 bg-gray-200 rounded-lg text-xs">✕</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="font-semibold text-gray-900 tabular-nums">{eur(b.spent)}</span>
                            <span className="text-gray-400">of</span>
                            <button
                              onClick={() => { setEditingBudget(b); setNewLimit(String(b.monthlyLimit)) }}
                              className="font-semibold text-blue-600 hover:underline tabular-nums"
                              title="Click to edit"
                            >
                              {eur(b.monthlyLimit)}
                            </button>
                            <span className={`font-bold tabular-nums w-10 text-right ${pct >= 100 ? 'text-red-600' : pct >= 80 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                              {pct}%
                            </span>
                            <button
                              onClick={() => saveBudgets(budgets.filter(x => x.id !== b.id))}
                              className="text-gray-300 hover:text-red-400 transition-colors ml-1"
                              title="Remove"
                            >
                              ✕
                            </button>
                          </div>
                        )}
                      </div>

                      <BudgetBar spent={b.spent} limit={b.monthlyLimit} />

                      <p className="text-xs mt-1.5 text-gray-400">
                        {remaining >= 0 ? (
                          `${eur(remaining)} remaining this month`
                        ) : (
                          <span className="text-red-500 font-semibold">⚠️ {eur(Math.abs(remaining))} over budget</span>
                        )}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* ── Unbudgeted spending ──────────────────────────────────────── */}
          {unbudgeted.length > 0 && (
            <section className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-bold text-gray-900">📊 Unbudgeted Spending</h2>
                <p className="text-xs text-gray-400 mt-0.5">You're spending here but haven't set a limit</p>
              </div>
              <div className="divide-y divide-gray-50">
                {unbudgeted.map(([cat, amount]) => {
                  const m = meta(cat)
                  return (
                    <div key={cat} className="flex items-center gap-3 px-6 py-3">
                      <span className="text-xl">{m.emoji}</span>
                      <span className="flex-1 font-medium text-gray-800">{m.label}</span>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums mr-3">{eur(amount)}</span>
                      <button
                        onClick={() => { setNewCategory(cat); setShowBudgetModal(true) }}
                        className="text-xs px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg transition-all whitespace-nowrap"
                      >
                        Set limit →
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ── Recurring transactions ───────────────────────────────── */}
          <section className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-bold text-gray-900">🔄 Recurring Transactions</h2>
                <p className="text-xs text-gray-400 mt-0.5">Auto-applied on the set day each month</p>
              </div>
              <button
                onClick={() => {
                  setRecurringForm(f => ({ ...f, accountId: checkingAccounts[0]?.id || accounts[0]?.id || '' }))
                  setShowRecurringModal(true)
                }}
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-xl text-sm transition-all active:scale-95 shadow-sm"
              >
                + Add Recurring
              </button>
            </div>

            {recurring.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="text-4xl mb-3">🔄</div>
                <p className="font-semibold text-gray-800 mb-1">No recurring transactions yet</p>
                <p className="text-sm text-gray-500 mb-5">Set up your salary, rent, subscriptions — they'll auto-apply each month on the day you choose.</p>
                <button
                  onClick={() => {
                    setRecurringForm(f => ({ ...f, accountId: checkingAccounts[0]?.id || accounts[0]?.id || '' }))
                    setShowRecurringModal(true)
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl text-sm active:scale-95 transition-all shadow-sm"
                >
                  + Add First Recurring Rule
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recurring.map(r => {
                  const acc = accounts.find(a => a.id === r.accountId)
                  const ordinal = (n: number) => {
                    const s = ['th','st','nd','rd']
                    const v = n % 100
                    return n + (s[(v - 20) % 10] || s[v] || s[0])
                  }
                  return (
                    <div key={r.id} className={`flex items-center gap-3 px-6 py-4 ${!r.active ? 'opacity-50' : ''}`}>
                      <span className="text-2xl">{r.isIncome ? '💰' : '💸'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{r.merchant}</p>
                        <p className="text-xs text-gray-400">
                          {ordinal(r.dayOfMonth)} of every month · {acc ? `${acc.icon} ${acc.name}` : 'Unknown account'}
                          {r.lastApplied && <span className="ml-2 text-emerald-600">✓ Applied {r.lastApplied}</span>}
                        </p>
                      </div>
                      <span className={`text-base font-bold tabular-nums mr-2 ${r.isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
                        {r.isIncome ? '+' : '-'}{eur(r.amount)}
                      </span>
                      <button
                        onClick={() => toggleRecurring(r.id)}
                        title={r.active ? 'Pause' : 'Resume'}
                        className={`w-8 h-8 rounded-lg text-xs flex items-center justify-center transition-all ${r.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        {r.active ? '⏸' : '▶'}
                      </button>
                      <button
                        onClick={() => deleteRecurring(r.id)}
                        className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center text-xs transition-all"
                        title="Delete rule"
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* No data state */}
          {accounts.length === 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="text-5xl mb-4">🏦</div>
              <p className="font-semibold text-gray-900 mb-2">No accounts connected</p>
              <p className="text-sm text-gray-500">Connect an account first to see your income and spending here.</p>
            </div>
          )}
        </div>

        {/* ── Set Budget Modal ─────────────────────────────────────────────── */}
        {showBudgetModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-gray-900">🎯 Set Monthly Budget</h3>
                <button onClick={() => { setShowBudgetModal(false); setNewLimit('') }} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {CATEGORY_OPTIONS.map(c => (
                      <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Monthly Limit (€)</label>
                  <input
                    type="number"
                    value={newLimit}
                    onChange={e => setNewLimit(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddBudget()}
                    placeholder="e.g., 300"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                  {budgets.some(b => b.category === newCategory) && (
                    <p className="text-xs text-blue-600 mt-1">A budget for this category already exists — saving will update it.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={handleAddBudget}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl text-sm active:scale-95 transition-all"
                >
                  Save Budget
                </button>
                <button
                  onClick={() => { setShowBudgetModal(false); setNewLimit('') }}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Log Income Modal ─────────────────────────────────────────────── */}
        {showIncomeModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-gray-900">💰 Log Income</h3>
                <button onClick={() => setShowIncomeModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Source *</label>
                  <input
                    type="text"
                    value={incomeForm.merchant}
                    onChange={e => setIncomeForm(f => ({ ...f, merchant: e.target.value }))}
                    placeholder="e.g., Monthly Salary, Client Payment"
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={incomeForm.amount}
                      onChange={e => setIncomeForm(f => ({ ...f, amount: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={incomeForm.date}
                      onChange={e => setIncomeForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Into Account *</label>
                  <select
                    value={incomeForm.accountId}
                    onChange={e => setIncomeForm(f => ({ ...f, accountId: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select account…</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-5">
                <button
                  onClick={handleLogIncome}
                  disabled={!incomeForm.merchant || !incomeForm.amount || !incomeForm.accountId}
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl text-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Log Income
                </button>
                <button
                  onClick={() => setShowIncomeModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {/* ── Add Recurring Modal ──────────────────────────────────────── */}
        {showRecurringModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-bold text-gray-900">🔄 Add Recurring Transaction</h3>
                <button onClick={() => setShowRecurringModal(false)} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
              </div>

              {/* Income / Expense toggle */}
              <div className="flex rounded-xl overflow-hidden border border-gray-200 mb-4">
                <button
                  onClick={() => setRecurringForm(f => ({ ...f, isIncome: true, category: 'income' }))}
                  className={`flex-1 py-2 text-sm font-semibold transition-all ${recurringForm.isIncome ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  💰 Income
                </button>
                <button
                  onClick={() => setRecurringForm(f => ({ ...f, isIncome: false, category: 'other' }))}
                  className={`flex-1 py-2 text-sm font-semibold transition-all ${!recurringForm.isIncome ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  💸 Expense
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {recurringForm.isIncome ? 'Income Source *' : 'Payee / Merchant *'}
                  </label>
                  <input
                    type="text"
                    value={recurringForm.merchant}
                    onChange={e => setRecurringForm(f => ({ ...f, merchant: e.target.value }))}
                    placeholder={recurringForm.isIncome ? 'e.g., Monthly Salary' : 'e.g., Netflix, Gym'}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={recurringForm.amount || ''}
                      onChange={e => setRecurringForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Day of Month *</label>
                    <input
                      type="number"
                      min={1}
                      max={28}
                      value={recurringForm.dayOfMonth}
                      onChange={e => setRecurringForm(f => ({ ...f, dayOfMonth: Math.min(28, Math.max(1, parseInt(e.target.value) || 1)) }))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                {!recurringForm.isIncome && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                    <select
                      value={recurringForm.category}
                      onChange={e => setRecurringForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      {CATEGORY_OPTIONS.map(c => (
                        <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Account *</label>
                  <select
                    value={recurringForm.accountId}
                    onChange={e => setRecurringForm(f => ({ ...f, accountId: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select account…</option>
                    {accounts.map(a => (
                      <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-3">
                This transaction will auto-apply on the {recurringForm.dayOfMonth}{['th','st','nd','rd'][((recurringForm.dayOfMonth % 100) - 20) % 10] || ['th','st','nd','rd'][recurringForm.dayOfMonth % 100] || 'th'} of each month when you open the app.
              </p>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddRecurring}
                  disabled={!recurringForm.merchant || !recurringForm.amount || !recurringForm.accountId}
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl text-sm active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Rule
                </button>
                <button
                  onClick={() => setShowRecurringModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </Layout>
    </>
  )
}
