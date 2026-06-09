import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'

interface StoredUser {
  id: string
  email: string
  name: string
}

interface Account {
  id: string
  name: string
  institution: string
  balance: number
  currency: string
  icon: string
  type: string
  transactions?: Array<{
    id: string
    date: string
    merchant: string
    amount: number
    category: string
    description: string
  }>
}

function eur(n: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n)
}

export default function SettingsPage() {
  const { loading, isAuthenticated, logout } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState<StoredUser | null>(null)
  const [editName, setEditName] = useState('')
  const [nameSaved, setNameSaved] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [exportDone, setExportDone] = useState<'json' | 'csv' | null>(null)

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/signin')
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    try {
      const u = localStorage.getItem('mock_user')
      if (u) {
        const parsed: StoredUser = JSON.parse(u)
        setProfile(parsed)
        setEditName(parsed.name)
      }
      const a = localStorage.getItem('user_accounts')
      if (a) setAccounts(JSON.parse(a))
    } catch { /* ignore */ }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }
  if (!isAuthenticated) return null

  const handleSaveName = () => {
    if (!editName.trim() || !profile) return
    const updated = { ...profile, name: editName.trim() }
    localStorage.setItem('mock_user', JSON.stringify(updated))
    setProfile(updated)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  const allTxs = accounts.flatMap((a) =>
    (a.transactions || []).map((tx) => ({ ...tx, accountName: a.name }))
  )
  const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0)

  const exportJSON = () => {
    const data = { exportedAt: new Date().toISOString(), accounts }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'financial-hub-data.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setExportDone('json')
    setTimeout(() => setExportDone(null), 2500)
  }

  const exportCSV = () => {
    const sorted = [...allTxs].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    const headers = ['Date', 'Merchant', 'Amount (EUR)', 'Category', 'Description', 'Account']
    const rows = sorted.map((tx) => [
      tx.date,
      `"${tx.merchant.replace(/"/g, '""')}"`,
      tx.amount.toFixed(2),
      tx.category,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      `"${tx.accountName.replace(/"/g, '""')}"`,
    ])
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'financial-hub-transactions.csv'
    anchor.click()
    URL.revokeObjectURL(url)
    setExportDone('csv')
    setTimeout(() => setExportDone(null), 2500)
  }

  const clearAllData = () => {
    localStorage.removeItem('user_accounts')
    setAccounts([])
    setShowClearConfirm(false)
    router.push('/dashboard')
  }

  return (
    <>
      <Head><title>Settings - Financial Hub</title></Head>
      <Layout title="Settings">
        <div className="max-w-2xl space-y-8">

          {/* ── Profile ──────────────────────────────────────────────── */}
          <section className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">👤 Profile</h2>
            <p className="text-sm text-gray-500 mb-5">Your personal details</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Display Name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  />
                  <button
                    onClick={handleSaveName}
                    className={`px-4 py-2.5 font-semibold rounded-xl text-sm transition-all active:scale-95 ${
                      nameSaved
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
                    }`}
                  >
                    {nameSaved ? '✓ Saved' : 'Save'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 select-all">
                  {profile?.email ?? '—'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">User ID</label>
                <div className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-400 font-mono select-all">
                  {profile?.id ?? '—'}
                </div>
              </div>
            </div>
          </section>

          {/* ── Connected Accounts Summary ────────────────────────────── */}
          <section className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">🏦 Connected Accounts</h2>
            <p className="text-sm text-gray-500 mb-5">{accounts.length} account{accounts.length !== 1 ? 's' : ''} · {eur(totalBalance)} total</p>

            {accounts.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No accounts connected yet.</p>
            ) : (
              <div className="divide-y divide-gray-100 -mx-6 px-0">
                {accounts.map((acc) => (
                  <div key={acc.id} className="flex items-center gap-3 px-6 py-3">
                    <span className="text-2xl">{acc.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{acc.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{acc.institution} · {acc.type}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900 tabular-nums">{eur(acc.balance)}</p>
                      <p className="text-xs text-gray-400">{(acc.transactions || []).length} txs</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Data & Export ─────────────────────────────────────────── */}
          <section className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-1">📦 Data & Export</h2>
            <p className="text-sm text-gray-500 mb-5">
              {allTxs.length} transaction{allTxs.length !== 1 ? 's' : ''} across {accounts.length} account{accounts.length !== 1 ? 's' : ''}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={exportCSV}
                disabled={allTxs.length === 0}
                className="flex items-center gap-3 p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-semibold text-emerald-900 text-sm">
                    {exportDone === 'csv' ? '✓ Downloaded!' : 'Export as CSV'}
                  </p>
                  <p className="text-xs text-emerald-700">Transactions spreadsheet</p>
                </div>
              </button>

              <button
                onClick={exportJSON}
                disabled={accounts.length === 0}
                className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-left"
              >
                <span className="text-2xl">🗄️</span>
                <div>
                  <p className="font-semibold text-blue-900 text-sm">
                    {exportDone === 'json' ? '✓ Downloaded!' : 'Export as JSON'}
                  </p>
                  <p className="text-xs text-blue-700">Full account backup</p>
                </div>
              </button>
            </div>
          </section>

          {/* ── Danger Zone ───────────────────────────────────────────── */}
          <section className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-red-200 shadow-sm">
            <h2 className="text-xl font-bold text-red-700 mb-1">⚠️ Danger Zone</h2>
            <p className="text-sm text-gray-500 mb-5">These actions are irreversible.</p>

            {!showClearConfirm ? (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-5 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-xl transition-all active:scale-95 text-sm"
              >
                🗑️ Clear All Account Data
              </button>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-3">
                <p className="text-sm font-semibold text-red-800">
                  This will delete all {accounts.length} account{accounts.length !== 1 ? 's' : ''} and {allTxs.length} transaction{allTxs.length !== 1 ? 's' : ''} from local storage. Are you sure?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={clearAllData}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm transition-all active:scale-95"
                  >
                    Yes, delete everything
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-red-100">
              <button
                onClick={() => { logout(); router.push('/signin') }}
                className="px-5 py-3 border border-red-300 hover:bg-red-50 text-red-700 font-semibold rounded-xl transition-all text-sm"
              >
                🚪 Sign Out
              </button>
            </div>
          </section>

          {/* ── App info ─────────────────────────────────────────────── */}
          <section className="text-center text-xs text-gray-400 space-y-1 pb-4">
            <p>Financial Hub · Personal Finance Dashboard</p>
            <p>Data stored locally in your browser · No cloud sync yet</p>
          </section>
        </div>
      </Layout>
    </>
  )
}
