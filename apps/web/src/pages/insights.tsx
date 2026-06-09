import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import Layout from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import {
  forecastSpending,
  detectAnomalies,
  suggestBudgets,
  overallSpendTrend,
  CAT_EMOJI,
  type ForecastResult,
  type AnomalyResult,
  type BudgetSuggestion,
  type TrendSummary,
} from '../utils/mlEngine'

interface Transaction {
  id: string
  date: string
  merchant: string
  amount: number
  category: string
  description?: string
}

interface Account {
  id: string
  name: string
  balance: number
  monthlySpend: number
  transactions?: Transaction[]
}

function eur(n: number) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(Math.abs(n))
}

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const styles = {
    high:   'bg-emerald-100 text-emerald-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low:    'bg-gray-100 text-gray-600',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${styles[level]}`}>
      {level === 'high' ? '● High confidence' : level === 'medium' ? '◐ Medium' : '○ Low — need more data'}
    </span>
  )
}

function TrendArrow({ trend, pct }: { trend: 'up' | 'down' | 'stable'; pct: number }) {
  if (trend === 'up')   return <span className="text-red-500 font-bold text-sm">↑ {Math.abs(pct)}%</span>
  if (trend === 'down') return <span className="text-emerald-500 font-bold text-sm">↓ {Math.abs(pct)}%</span>
  return <span className="text-gray-500 font-bold text-sm">→ stable</span>
}

function MiniBarChart({ values, predicted }: { values: number[]; predicted: number }) {
  const all   = [...values, predicted]
  const max   = Math.max(...all, 1)
  const MONTHS = ['–5', '–4', '–3', '–2', '–1', 'Now', 'Next']

  return (
    <div className="flex items-end gap-1 h-16">
      {values.map((v, i) => (
        <div key={i} className="flex flex-col items-center flex-1">
          <div
            className="w-full bg-blue-300 rounded-t"
            style={{ height: `${Math.round((v / max) * 56)}px` }}
            title={`Month -${5 - i}: ${eur(v)}`}
          />
          <span className="text-xs text-gray-400 mt-0.5">{MONTHS[i]}</span>
        </div>
      ))}
      {/* Predicted bar */}
      <div className="flex flex-col items-center flex-1">
        <div
          className="w-full bg-purple-400 rounded-t border-2 border-dashed border-purple-600"
          style={{ height: `${Math.round((predicted / max) * 56)}px` }}
          title={`Predicted: ${eur(predicted)}`}
        />
        <span className="text-xs text-purple-700 mt-0.5 font-semibold">Next</span>
      </div>
    </div>
  )
}

export default function InsightsPage() {
  const router = useRouter()
  const { loading, isAuthenticated } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [forecasts, setForecasts]   = useState<ForecastResult[]>([])
  const [anomalies, setAnomalies]   = useState<AnomalyResult[]>([])
  const [suggestions, setSuggestions] = useState<BudgetSuggestion[]>([])
  const [trend, setTrend]           = useState<TrendSummary | null>(null)
  const [activeTab, setActiveTab]   = useState<'forecast' | 'anomalies' | 'budgets' | 'trends'>('forecast')
  const [budgets, setBudgets]       = useState<Record<string, number>>({})

  useEffect(() => {
    if (!loading && !isAuthenticated) router.push('/signin')
  }, [loading, isAuthenticated, router])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user_accounts')
      if (!raw) return
      const accs: Account[] = JSON.parse(raw)
      setAccounts(accs)

      const allTxs: Transaction[] = accs.flatMap(a => a.transactions ?? [])
      if (allTxs.length === 0) return

      setForecasts(forecastSpending(allTxs))
      setAnomalies(detectAnomalies(allTxs))
      setSuggestions(suggestBudgets(allTxs))
      setTrend(overallSpendTrend(allTxs))

      // Load existing budgets for comparison
      const b = localStorage.getItem('user_budgets')
      if (b) {
        const arr: { category: string; monthlyLimit: number }[] = JSON.parse(b)
        const map: Record<string, number> = {}
        arr.forEach(x => { map[x.category] = x.monthlyLimit })
        setBudgets(map)
      }
    } catch {/* ignore */}
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )
  if (!isAuthenticated) return null

  const allTxs: Transaction[] = accounts.flatMap(a => a.transactions ?? [])

  if (allTxs.length === 0) {
    return (
      <>
        <Head><title>ML Insights - Financial Hub</title></Head>
        <Layout title="ML Insights">
          <div className="max-w-2xl bg-white/80 backdrop-blur-xl rounded-2xl p-10 border border-white/20 text-center">
            <div className="text-5xl mb-4">🤖</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No data to analyse yet</h2>
            <p className="text-gray-500 text-sm mb-6">
              Connect accounts with at least 2 months of transactions to unlock forecasting, anomaly detection, and budget recommendations.
            </p>
            <Link href="/accounts" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl text-sm hover:from-blue-700 hover:to-purple-700 transition-all">
              Connect Accounts →
            </Link>
          </div>
        </Layout>
      </>
    )
  }

  // ── Quick stats ─────────────────────────────────────────────────────────────
  const totalPredicted = forecasts.reduce((s, f) => s + f.predicted, 0)
  const highConfCount  = forecasts.filter(f => f.confidence === 'high').length
  const anomalyCount   = anomalies.length
  const overBudget     = forecasts.filter(f => budgets[f.category] && f.predicted > budgets[f.category]).length

  return (
    <>
      <Head><title>ML Insights - Financial Hub</title></Head>
      <Layout title="ML Insights">
        <div className="max-w-4xl space-y-8">
          <p className="text-gray-500 -mt-6 text-sm">
            Powered by linear regression · {allTxs.length.toLocaleString()} transactions analysed
          </p>

          {/* ── Quick summary cards ─────────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-5 text-white shadow-sm">
              <p className="text-white/80 text-xs font-semibold mb-1">🔮 Predicted Next Mo.</p>
              <p className="text-2xl font-bold">{eur(totalPredicted)}</p>
              <p className="text-white/60 text-xs mt-1">{highConfCount} high-confidence</p>
            </div>
            <div className={`bg-gradient-to-br ${trend?.trendLabel === 'Spending is rising' ? 'from-red-500 to-orange-500' : trend?.trendLabel === 'Spending is falling' ? 'from-emerald-500 to-teal-500' : 'from-blue-500 to-cyan-500'} rounded-2xl p-5 text-white shadow-sm`}>
              <p className="text-white/80 text-xs font-semibold mb-1">📈 Overall Trend</p>
              <p className="text-lg font-bold leading-tight">{trend?.trendLabel ?? '—'}</p>
              <p className="text-white/60 text-xs mt-1">{trend ? `${trend.changePercent > 0 ? '+' : ''}${trend.changePercent}% projected` : ''}</p>
            </div>
            <div className={`bg-gradient-to-br ${anomalyCount > 0 ? 'from-amber-500 to-orange-500' : 'from-gray-400 to-gray-500'} rounded-2xl p-5 text-white shadow-sm`}>
              <p className="text-white/80 text-xs font-semibold mb-1">🚨 Anomalies</p>
              <p className="text-2xl font-bold">{anomalyCount}</p>
              <p className="text-white/60 text-xs mt-1">{anomalyCount > 0 ? 'unusual transactions' : 'none detected'}</p>
            </div>
            <div className={`bg-gradient-to-br ${overBudget > 0 ? 'from-red-500 to-pink-500' : 'from-emerald-500 to-teal-500'} rounded-2xl p-5 text-white shadow-sm`}>
              <p className="text-white/80 text-xs font-semibold mb-1">⚠️ Budget Risk</p>
              <p className="text-2xl font-bold">{overBudget}</p>
              <p className="text-white/60 text-xs mt-1">{overBudget > 0 ? 'categories at risk' : 'all on track'}</p>
            </div>
          </div>

          {/* ── Tab nav ─────────────────────────────────────────────────── */}
          <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
            {([
              { key: 'forecast',  label: '🔮 Forecast' },
              { key: 'anomalies', label: '🚨 Anomalies' },
              { key: 'budgets',   label: '💡 Recommendations' },
              { key: 'trends',    label: '📈 Trends' },
            ] as const).map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── Forecast tab ────────────────────────────────────────────── */}
          {activeTab === 'forecast' && (
            <section className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
                <strong>How it works:</strong> Ordinary least-squares linear regression on 6 months of spending per category. Purple bars are predictions; confidence reflects how many data points were available.
              </div>
              {forecasts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Not enough history to forecast yet — need at least 2 months of transactions.</div>
              ) : (
                forecasts.map(f => (
                  <div key={f.category} className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{CAT_EMOJI[f.category] ?? '💳'}</span>
                        <div>
                          <p className="font-bold text-gray-900 capitalize">{f.category}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <ConfidenceBadge level={f.confidence} />
                            <span className="text-xs text-gray-400">R²={f.r2.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-purple-700 tabular-nums">{eur(f.predicted)}</p>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          <TrendArrow trend={f.trend} pct={f.changePercent} />
                          <span className="text-xs text-gray-400">vs last month</span>
                        </div>
                      </div>
                    </div>

                    <MiniBarChart values={f.history} predicted={f.predicted} />

                    {budgets[f.category] && (
                      <div className={`mt-3 text-xs px-3 py-1.5 rounded-lg font-semibold ${f.predicted > budgets[f.category] ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {f.predicted > budgets[f.category]
                          ? `⚠️ Predicted to exceed your ${eur(budgets[f.category])} budget by ${eur(f.predicted - budgets[f.category])}`
                          : `✓ Within your ${eur(budgets[f.category])} budget`
                        }
                      </div>
                    )}
                  </div>
                ))
              )}
            </section>
          )}

          {/* ── Anomalies tab ────────────────────────────────────────────── */}
          {activeTab === 'anomalies' && (
            <section className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
                <strong>How it works:</strong> Z-score anomaly detection — flags transactions where the amount deviates more than 1.8 standard deviations from the category average. Higher z-score = more unusual.
              </div>
              {anomalies.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-10 border border-white/20 text-center">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="font-semibold text-gray-900">No anomalies detected</p>
                  <p className="text-sm text-gray-500 mt-1">All transactions look consistent with your usual spending patterns.</p>
                </div>
              ) : (
                anomalies.map((a, i) => {
                  const pctAbove = Math.round(((Math.abs(a.tx.amount) - a.categoryAvg) / a.categoryAvg) * 100)
                  const severity = a.zscore > 3 ? 'high' : a.zscore > 2.5 ? 'medium' : 'low'
                  const severityStyle = severity === 'high' ? 'border-red-300 bg-red-50' : severity === 'medium' ? 'border-amber-300 bg-amber-50' : 'border-yellow-200 bg-yellow-50'
                  return (
                    <div key={i} className={`rounded-2xl p-5 border-2 shadow-sm ${severityStyle}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{CAT_EMOJI[a.tx.category] ?? '💳'}</span>
                          <div>
                            <p className="font-bold text-gray-900">{a.tx.merchant}</p>
                            <p className="text-xs text-gray-500">{a.tx.date} · {a.tx.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-red-700 tabular-nums">{eur(Math.abs(a.tx.amount))}</p>
                          <p className="text-xs text-gray-500">z={a.zscore.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex-1 bg-white rounded-lg p-2 text-xs text-gray-700">
                          <span className="font-semibold">Category avg:</span> {eur(a.categoryAvg)} · <span className="font-semibold">This tx:</span> {pctAbove}% above average
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${severity === 'high' ? 'bg-red-200 text-red-800' : severity === 'medium' ? 'bg-amber-200 text-amber-800' : 'bg-yellow-200 text-yellow-800'}`}>
                          {severity}
                        </span>
                      </div>
                    </div>
                  )
                })
              )}
            </section>
          )}

          {/* ── Budget Recommendations tab ──────────────────────────────── */}
          {activeTab === 'budgets' && (
            <section className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 text-sm text-purple-900">
                <strong>How it works:</strong> 75th-percentile of your monthly spending per category over 6 months, plus a 10% buffer. This keeps you comfortable without over-constraining typical months.
              </div>
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Need at least 2 months of data per category to make recommendations.</div>
              ) : (
                suggestions.map(s => {
                  const existing = budgets[s.category]
                  const diff = existing ? existing - s.suggestion : null
                  return (
                    <div key={s.category} className="bg-white/80 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{CAT_EMOJI[s.category] ?? '💳'}</span>
                        <div className="flex-1">
                          <p className="font-bold text-gray-900 capitalize">{s.category}</p>
                          <p className="text-xs text-gray-400">{s.reasoning}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-purple-700 tabular-nums">{eur(s.suggestion)}<span className="text-sm text-gray-400">/mo</span></p>
                          {existing && (
                            <p className={`text-xs font-semibold ${diff! > 0 ? 'text-blue-600' : 'text-amber-600'}`}>
                              {diff! > 0 ? `vs your ${eur(existing)} (${eur(Math.abs(diff!))} headroom)` : `vs your ${eur(existing)} (${eur(Math.abs(diff!))} tighter)`}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-gray-400">Average</p>
                          <p className="font-semibold text-gray-700 tabular-nums">{eur(s.mean)}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-gray-400">Median</p>
                          <p className="font-semibold text-gray-700 tabular-nums">{eur(s.p50)}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-2">
                          <p className="text-purple-600">Suggested</p>
                          <p className="font-bold text-purple-700 tabular-nums">{eur(s.suggestion)}</p>
                        </div>
                      </div>

                      {!existing && (
                        <Link
                          href="/budgets"
                          className="mt-3 block text-center text-xs py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold rounded-lg transition-all"
                        >
                          → Set this budget in /budgets
                        </Link>
                      )}
                    </div>
                  )
                })
              )}
            </section>
          )}

          {/* ── Trends tab ──────────────────────────────────────────────── */}
          {activeTab === 'trends' && trend && (
            <section className="space-y-6">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-white/20 shadow-sm">
                <h3 className="font-bold text-gray-900 mb-1">Overall Spending Trend — Last 6 Months</h3>
                <p className="text-sm text-gray-500 mb-4">Linear regression fit across all non-income categories.</p>

                <div className="flex items-end gap-2 h-32 mb-4">
                  {trend.totalSpend6m.map((v, i) => {
                    const max = Math.max(...trend.totalSpend6m, trend.predicted, 1)
                    const pct = Math.round((v / max) * 100)
                    const LABELS = ['5mo ago','4mo ago','3mo ago','2mo ago','Last mo','This mo']
                    return (
                      <div key={i} className="flex flex-col items-center flex-1">
                        <div className="w-full bg-blue-400 rounded-t" style={{ height: `${pct}%` }} title={eur(v)} />
                        <span className="text-xs text-gray-400 mt-1 text-center leading-tight">{LABELS[i]}</span>
                      </div>
                    )
                  })}
                  {/* Prediction */}
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className="w-full bg-purple-400 rounded-t border-2 border-dashed border-purple-700"
                      style={{ height: `${Math.round((trend.predicted / Math.max(...trend.totalSpend6m, trend.predicted, 1)) * 100)}%` }}
                      title={`Predicted: ${eur(trend.predicted)}`}
                    />
                    <span className="text-xs text-purple-700 mt-1 font-semibold">Next mo</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-sm">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-gray-400 text-xs">This month</p>
                    <p className="font-bold text-gray-900">{eur(trend.totalSpend6m[5] ?? 0)}</p>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-3">
                    <p className="text-purple-500 text-xs">Predicted</p>
                    <p className="font-bold text-purple-700">{eur(trend.predicted)}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${trend.changePercent > 0 ? 'bg-red-50' : trend.changePercent < 0 ? 'bg-emerald-50' : 'bg-gray-50'}`}>
                    <p className="text-gray-400 text-xs">Change</p>
                    <p className={`font-bold ${trend.changePercent > 0 ? 'text-red-600' : trend.changePercent < 0 ? 'text-emerald-600' : 'text-gray-700'}`}>
                      {trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-900">
                  <strong>Model quality:</strong> R² = {trend.r2.toFixed(3)} — {trend.r2 > 0.7 ? 'strong linear fit (predictions are reliable)' : trend.r2 > 0.4 ? 'moderate fit (predictions are indicative)' : 'weak fit (spending varies significantly month to month)'}
                </div>
              </div>

              {/* Per-category trends */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {forecasts.map(f => (
                  <div key={f.category} className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white/20 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 flex items-center gap-1.5">
                        {CAT_EMOJI[f.category] ?? '💳'} <span className="capitalize">{f.category}</span>
                      </span>
                      <TrendArrow trend={f.trend} pct={f.changePercent} />
                    </div>
                    <div className="flex items-end gap-1 h-8">
                      {f.history.map((v, i) => {
                        const max = Math.max(...f.history, f.predicted, 1)
                        return (
                          <div key={i} className="flex-1 bg-blue-300 rounded-sm" style={{ height: `${Math.round((v / max) * 100)}%` }} />
                        )
                      })}
                      <div className="flex-1 bg-purple-400 rounded-sm border border-dashed border-purple-600" style={{ height: `${Math.round((f.predicted / Math.max(...f.history, f.predicted, 1)) * 100)}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>6 months ago</span>
                      <span className="text-purple-600 font-semibold">→ {eur(f.predicted)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </Layout>
    </>
  )
}
