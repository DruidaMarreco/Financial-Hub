/**
 * Financial ML Engine
 * Implements linear regression, anomaly detection (Z-score),
 * spending forecasting, and budget recommendations.
 */

export interface Transaction {
  id: string
  date: string
  merchant: string
  amount: number
  category: string
  description?: string
}

// ── Linear Regression ────────────────────────────────────────────────────────
// Ordinary least squares: y = a + b·x, x = 0,1,...,n-1
// Returns predicted value at x = n (i.e. "next period")
export function linearRegression(values: number[]): number {
  const n = values.length
  if (n === 0) return 0
  if (n === 1) return values[0]

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX  += i
    sumY  += values[i]
    sumXY += i * values[i]
    sumX2 += i * i
  }
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return sumY / n
  const b = (n * sumXY - sumX * sumY) / denom
  const a = (sumY - b * sumX) / n
  return Math.max(0, a + b * n)
}

// R² coefficient of determination (0–1; higher = better fit)
export function rSquared(values: number[]): number {
  const n = values.length
  if (n < 2) return 0
  const mean = values.reduce((s, v) => s + v, 0) / n
  const ssTot = values.reduce((s, v) => s + (v - mean) ** 2, 0)
  if (ssTot === 0) return 1

  // recompute residuals
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX  += i; sumY  += values[i]
    sumXY += i * values[i]; sumX2 += i * i
  }
  const denom = n * sumX2 - sumX * sumX
  if (denom === 0) return 0
  const b = (n * sumXY - sumX * sumY) / denom
  const a = (sumY - b * sumX) / n
  const ssRes = values.reduce((s, v, i) => s + (v - (a + b * i)) ** 2, 0)
  return Math.max(0, 1 - ssRes / ssTot)
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function monthKey(offsetFromNow = 0): string {
  const d = new Date()
  const shifted = new Date(d.getFullYear(), d.getMonth() - offsetFromNow, 1)
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}`
}

function last6MonthKeys(): string[] {
  return Array.from({ length: 6 }, (_, i) => monthKey(5 - i))  // oldest → newest
}

const SKIP_CATS = new Set(['income', 'savings'])

// ── Spending Forecast ────────────────────────────────────────────────────────
export interface ForecastResult {
  category:      string
  history:       number[]          // 6 monthly values, oldest first
  predicted:     number            // next-month predicted spend
  trend:         'up' | 'down' | 'stable'
  changePercent: number            // vs last historical month
  confidence:    'high' | 'medium' | 'low'  // based on data richness
  r2:            number
}

export function forecastSpending(txs: Transaction[]): ForecastResult[] {
  const keys = last6MonthKeys()
  const cats = new Set<string>()

  txs.filter(t => t.amount < 0 && !SKIP_CATS.has(t.category || '')).forEach(t => {
    cats.add(t.category || 'other')
  })

  return Array.from(cats).map(cat => {
    const history = keys.map(k =>
      txs.filter(t => t.amount < 0 && (t.category || 'other') === cat && t.date?.startsWith(k))
         .reduce((s, t) => s + Math.abs(t.amount), 0)
    )

    const nonZero = history.filter(v => v > 0).length
    const predicted  = Math.round(linearRegression(history) * 100) / 100
    const lastMonth  = history[history.length - 1] ?? 0
    const changePercent = lastMonth > 0 ? Math.round(((predicted - lastMonth) / lastMonth) * 100) : 0
    const trend: ForecastResult['trend'] = changePercent >  5 ? 'up'
                                         : changePercent < -5 ? 'down' : 'stable'
    const confidence: ForecastResult['confidence'] = nonZero >= 4 ? 'high'
                                                    : nonZero >= 2 ? 'medium' : 'low'
    const r2 = rSquared(history)

    return { category: cat, history, predicted, trend, changePercent, confidence, r2 }
  })
  .filter(r => r.history.some(v => v > 0) && r.predicted > 0)
  .sort((a, b) => b.predicted - a.predicted)
}

// ── Anomaly Detection (Z-score) ──────────────────────────────────────────────
export interface AnomalyResult {
  tx:          Transaction
  zscore:      number
  categoryAvg: number
  categoryStd: number
  isUnusuallyLarge: boolean
}

export function detectAnomalies(txs: Transaction[]): AnomalyResult[] {
  const expenseTxs = txs.filter(t => t.amount < 0)

  // Build per-category stats
  const catAmounts = new Map<string, number[]>()
  expenseTxs.forEach(t => {
    const c = t.category || 'other'
    const arr = catAmounts.get(c) ?? []
    arr.push(Math.abs(t.amount))
    catAmounts.set(c, arr)
  })

  const catStats = new Map<string, { mean: number; std: number }>()
  catAmounts.forEach((amounts, cat) => {
    const mean = amounts.reduce((s, v) => s + v, 0) / amounts.length
    const std  = Math.sqrt(amounts.reduce((s, v) => s + (v - mean) ** 2, 0) / amounts.length)
    catStats.set(cat, { mean, std })
  })

  const results: AnomalyResult[] = []

  expenseTxs.forEach(t => {
    const c = t.category || 'other'
    const stats = catStats.get(c)
    if (!stats || stats.std < 0.01) return  // not enough spread
    const amounts = catAmounts.get(c) ?? []
    if (amounts.length < 3) return           // need baseline

    const abs     = Math.abs(t.amount)
    const zscore  = (abs - stats.mean) / stats.std
    if (zscore > 1.8) {
      results.push({ tx: t, zscore, categoryAvg: stats.mean, categoryStd: stats.std, isUnusuallyLarge: true })
    }
  })

  // Deduplicate (keep highest z-score per merchant+category)
  const seen = new Set<string>()
  return results
    .sort((a, b) => b.zscore - a.zscore)
    .filter(r => {
      const key = `${r.tx.merchant}|${r.tx.category}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 6)
}

// ── Budget Suggestions (75th percentile) ─────────────────────────────────────
export interface BudgetSuggestion {
  category:   string
  suggestion: number   // rounded to nearest 10
  mean:       number
  p50:        number
  p75:        number
  months:     number   // how many months had data
  reasoning:  string
}

export function suggestBudgets(txs: Transaction[]): BudgetSuggestion[] {
  const keys = last6MonthKeys()

  const monthlyBycat: Record<string, number[]> = {}

  keys.forEach(k => {
    const catTotals: Record<string, number> = {}
    txs.filter(t => t.amount < 0 && t.date?.startsWith(k)).forEach(t => {
      const c = t.category || 'other'
      if (SKIP_CATS.has(c)) return
      catTotals[c] = (catTotals[c] ?? 0) + Math.abs(t.amount)
    })
    Object.entries(catTotals).forEach(([c, v]) => {
      if (!monthlyBycat[c]) monthlyBycat[c] = []
      monthlyBycat[c].push(v)
    })
  })

  return Object.entries(monthlyBycat)
    .filter(([, arr]) => arr.length >= 2)
    .map(([cat, arr]) => {
      const sorted = [...arr].sort((a, b) => a - b)
      const mean  = arr.reduce((s, v) => s + v, 0) / arr.length
      const p50   = sorted[Math.floor(sorted.length * 0.5)] ?? mean
      const p75   = sorted[Math.floor(sorted.length * 0.75)] ?? sorted[sorted.length - 1] ?? mean
      // Round suggestion up to nearest 10, add 10% buffer
      const raw   = p75 * 1.1
      const suggestion = Math.ceil(raw / 10) * 10

      const reasoning = arr.length >= 4
        ? `Based on ${arr.length} months of data. Typical spend: €${Math.round(mean)}/mo, max: €${Math.round(sorted[sorted.length - 1])}.`
        : `Based on ${arr.length} months — more data improves accuracy.`

      return { category: cat, suggestion, mean, p50, p75, months: arr.length, reasoning }
    })
    .sort((a, b) => b.mean - a.mean)
}

// ── Trend Summary ─────────────────────────────────────────────────────────────
export interface TrendSummary {
  totalSpend6m:  number[]   // 6 monthly totals
  slope:         number     // positive = rising, negative = falling
  predicted:     number     // next month total
  trendLabel:    'Spending is rising' | 'Spending is falling' | 'Spending is stable'
  changePercent: number
  r2:            number
}

export function overallSpendTrend(txs: Transaction[]): TrendSummary {
  const keys = last6MonthKeys()
  const totals = keys.map(k =>
    txs.filter(t => t.amount < 0 && !SKIP_CATS.has(t.category || '') && t.date?.startsWith(k))
       .reduce((s, t) => s + Math.abs(t.amount), 0)
  )

  const n = totals.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i; sumY += totals[i]; sumXY += i * totals[i]; sumX2 += i * i
  }
  const denom = n * sumX2 - sumX * sumX
  const slope = denom === 0 ? 0 : (n * sumXY - sumX * sumY) / denom
  const a     = (sumY - slope * sumX) / n
  const predicted = Math.max(0, a + slope * n)
  const last  = totals[n - 1] ?? 0
  const changePercent = last > 0 ? Math.round(((predicted - last) / last) * 100) : 0
  const trendLabel = changePercent > 3 ? 'Spending is rising'
                   : changePercent < -3 ? 'Spending is falling' : 'Spending is stable'

  return { totalSpend6m: totals, slope, predicted, trendLabel, changePercent, r2: rSquared(totals) }
}

// ── Category emoji map ────────────────────────────────────────────────────────
export const CAT_EMOJI: Record<string, string> = {
  groceries: '🛒', dining: '🍽️', coffee: '☕', transport: '🚌',
  entertainment: '🎬', shopping: '🛍️', healthcare: '💊',
  utilities: '💡', investment: '📈', income: '💰', savings: '🏦', other: '💳',
}
