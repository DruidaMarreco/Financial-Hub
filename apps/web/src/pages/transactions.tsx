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

interface ExtendedTransaction extends Transaction {
  accountId: string
  accountName: string
}

interface StoredAccount {
  id: string
  name: string
  transactions?: Transaction[]
}

type SortOrder = 'newest' | 'oldest' | 'highest' | 'lowest'

const CATEGORIES = [
  'groceries', 'dining', 'coffee', 'transport', 'entertainment',
  'shopping', 'healthcare', 'utilities', 'income', 'savings', 'other',
]

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    groceries: '🛒', dining: '🍽️', coffee: '☕', transport: '🚌',
    entertainment: '🎬', shopping: '🛍️', healthcare: '💊', utilities: '💡',
    income: '💰', savings: '💾', other: '💳',
  }
  return map[category?.toLowerCase()] ?? '💳'
}

function formatEur(amount: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(
    Math.abs(amount)
  )
}

interface TxFormData {
  merchant: string
  amount: string
  isExpense: boolean
  category: string
  date: string
  description: string
  accountId: string
}

const DEFAULT_FORM: TxFormData = {
  merchant: '',
  amount: '',
  isExpense: true,
  category: 'other',
  date: new Date().toISOString().slice(0, 10),
  description: '',
  accountId: '',
}

interface TxModalProps {
  mode: 'add' | 'edit'
  initial: TxFormData
  accounts: StoredAccount[]
  onSave: (data: TxFormData) => void
  onDelete?: () => void
  onClose: () => void
}

function TxModal({ mode, initial, accounts, onSave, onDelete, onClose }: TxModalProps) {
  const [form, setForm] = useState<TxFormData>(initial)
  const set = (patch: Partial<TxFormData>) => setForm((f) => ({ ...f, ...patch }))

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'add' ? '➕ Add Transaction' : '✏️ Edit Transaction'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-xl">✕</button>
        </div>

        <div className="space-y-4">
          {/* Expense / Income toggle */}
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            <button
              type="button"
              onClick={() => set({ isExpense: true })}
              className={`flex-1 py-2 text-sm font-semibold transition-all ${form.isExpense ? 'bg-red-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              💸 Expense
            </button>
            <button
              type="button"
              onClick={() => set({ isExpense: false })}
              className={`flex-1 py-2 text-sm font-semibold transition-all ${!form.isExpense ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              💰 Income
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Merchant / Description *</label>
            <input
              type="text"
              value={form.merchant}
              onChange={(e) => set({ merchant: e.target.value })}
              placeholder="e.g., Pingo Doce, Salary"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (€) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={(e) => set({ amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => set({ date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => set({ category: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {getCategoryEmoji(c)} {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Account *</label>
            <select
              value={form.accountId}
              onChange={(e) => set({ accountId: e.target.value })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              disabled={mode === 'edit'}
            >
              <option value="">Select account…</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notes (optional)</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Extra details..."
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={() => {
              if (!form.merchant || !form.amount || !form.accountId) return
              onSave(form)
            }}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all active:scale-95"
          >
            {mode === 'add' ? 'Add Transaction' : 'Save Changes'}
          </button>
          {mode === 'edit' && onDelete && (
            <button
              onClick={onDelete}
              className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-xl transition-all active:scale-95"
              title="Delete transaction"
            >
              🗑️
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  const router = useRouter()
  const { loading, isAuthenticated } = useAuth()

  const [accounts, setAccounts] = useState<StoredAccount[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTx, setEditingTx] = useState<ExtendedTransaction | null>(null)

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

  const saveAccounts = (updated: StoredAccount[]) => {
    setAccounts(updated)
    localStorage.setItem('user_accounts', JSON.stringify(updated))
  }

  const handleAdd = (data: TxFormData) => {
    if (!data.merchant || !data.amount || !data.accountId) return
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      date: data.date,
      merchant: data.merchant,
      amount: data.isExpense ? -Math.abs(parseFloat(data.amount)) : Math.abs(parseFloat(data.amount)),
      category: data.category,
      description: data.description,
    }
    const updated = accounts.map((acc) =>
      acc.id === data.accountId
        ? { ...acc, transactions: [newTx, ...(acc.transactions || [])] }
        : acc
    )
    saveAccounts(updated)
    setShowAddModal(false)
  }

  const handleEdit = (data: TxFormData) => {
    if (!editingTx) return
    const updated = accounts.map((acc) => {
      if (acc.id !== editingTx.accountId) return acc
      return {
        ...acc,
        transactions: (acc.transactions || []).map((tx) =>
          tx.id === editingTx.id
            ? {
                ...tx,
                date: data.date,
                merchant: data.merchant,
                amount: data.isExpense ? -Math.abs(parseFloat(data.amount)) : Math.abs(parseFloat(data.amount)),
                category: data.category,
                description: data.description,
              }
            : tx
        ),
      }
    })
    saveAccounts(updated)
    setEditingTx(null)
  }

  const handleDelete = (tx: ExtendedTransaction) => {
    const updated = accounts.map((acc) =>
      acc.id !== tx.accountId
        ? acc
        : { ...acc, transactions: (acc.transactions || []).filter((t) => t.id !== tx.id) }
    )
    saveAccounts(updated)
    setEditingTx(null)
  }

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

  const allTxs: ExtendedTransaction[] = accounts.flatMap((a) =>
    (a.transactions || []).map((tx) => ({ ...tx, accountId: a.id, accountName: a.name }))
  )

  const categories = ['all', ...Array.from(new Set(allTxs.map((t) => t.category).filter(Boolean)))]

  const filtered = allTxs
    .filter((t) => {
      const term = searchTerm.toLowerCase()
      const matchesSearch =
        !searchTerm ||
        (t.merchant?.toLowerCase() ?? '').includes(term) ||
        (t.description?.toLowerCase() ?? '').includes(term)
      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      if (sortOrder === 'newest') return new Date(b.date).getTime() - new Date(a.date).getTime()
      if (sortOrder === 'oldest') return new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sortOrder === 'highest') return Math.abs(b.amount) - Math.abs(a.amount)
      if (sortOrder === 'lowest') return Math.abs(a.amount) - Math.abs(b.amount)
      return 0
    })

  const totalSpending = allTxs.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalIncome = allTxs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)

  return (
    <Layout title="Transactions">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-500 mt-1">All your transactions across accounts</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-95"
          >
            ➕ Add Transaction
          </button>
        </div>

        {/* Summary metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-2xl text-white">
            <p className="text-blue-100 text-sm font-medium">Total Transactions</p>
            <p className="text-3xl font-bold mt-1">{allTxs.length}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-pink-600 p-6 rounded-2xl text-white">
            <p className="text-red-100 text-sm font-medium">Total Spending</p>
            <p className="text-3xl font-bold mt-1">{formatEur(totalSpending)}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl text-white">
            <p className="text-emerald-100 text-sm font-medium">Total Income</p>
            <p className="text-3xl font-bold mt-1">{formatEur(totalIncome)}</p>
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
                {cat === 'all' ? 'All Categories' : `${getCategoryEmoji(cat)} ${cat.charAt(0).toUpperCase() + cat.slice(1)}`}
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
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-10 border border-white/20 text-center">
            <div className="text-5xl mb-4">💳</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Transactions Yet</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              Connect Demo Bank to import 90 days of transactions, or add one manually above.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl shadow transition-all active:scale-95"
            >
              ➕ Add Transaction
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 border border-white/20 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Results Found</h2>
            <p className="text-gray-500 text-sm">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filtered.map((tx) => (
                <div
                  key={`${tx.accountId}-${tx.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-white/60 transition-colors group"
                >
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <span className="text-2xl flex-shrink-0">{getCategoryEmoji(tx.category)}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{tx.merchant}</p>
                      {tx.description && (
                        <p className="text-xs text-gray-500 truncate">{tx.description}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {tx.date} · <span className="text-gray-500">{tx.accountName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium capitalize hidden sm:inline">
                      {tx.category}
                    </span>
                    <span className={`text-base font-semibold tabular-nums ${tx.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {tx.amount >= 0 ? '+' : '-'}{formatEur(tx.amount)}
                    </span>
                    <button
                      onClick={() =>
                        setEditingTx(tx)
                      }
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all"
                      title="Edit transaction"
                    >
                      ✏️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <TxModal
          mode="add"
          initial={{ ...DEFAULT_FORM, accountId: accounts[0]?.id || '' }}
          accounts={accounts}
          onSave={handleAdd}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* Edit Modal */}
      {editingTx && (
        <TxModal
          mode="edit"
          initial={{
            merchant: editingTx.merchant,
            amount: String(Math.abs(editingTx.amount)),
            isExpense: editingTx.amount < 0,
            category: editingTx.category,
            date: editingTx.date,
            description: editingTx.description || '',
            accountId: editingTx.accountId,
          }}
          accounts={accounts}
          onSave={handleEdit}
          onDelete={() => handleDelete(editingTx)}
          onClose={() => setEditingTx(null)}
        />
      )}
    </Layout>
  )
}
