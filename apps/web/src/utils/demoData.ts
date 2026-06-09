export interface Transaction {
  id: string
  date: string
  merchant: string
  amount: number
  category: string
  description: string
}

export interface BalancePoint {
  date: string
  balance: number
}

export interface MealCardSpecific {
  provider?: string
  expiryDate?: string
  monthlyAllowance?: number
}

export interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  institution: string
  status: string
  icon: string
  lastUpdated: string
  monthlySpend: number
  transactions: Transaction[]
  balanceHistory: BalancePoint[]
  mealCardSpecific?: MealCardSpecific
}

// ── Config types ──────────────────────────────────────────────────────────────

export interface DemoAccountConfig {
  id: string
  name: string
  type: 'checking' | 'savings' | 'investment' | 'meal-card'
  institution: string
  icon: string
  balance: number
  include: boolean
  monthlyAllowance?: number   // meal card
  mealProvider?: string       // meal card
}

export interface DemoConfig {
  accounts: DemoAccountConfig[]
  daysOfHistory: number
}

export const DEFAULT_DEMO_CONFIG: DemoConfig = {
  accounts: [
    { id: 'revolut',    name: 'My Revolut',          type: 'checking',   institution: 'revolut',   icon: '🟦', balance: 2450.80, include: true },
    { id: 'savings',    name: 'Emergency Fund',       type: 'savings',    institution: 'cgd',       icon: '🏦', balance: 8200,    include: true },
    { id: 'investment', name: 'ETF Portfolio',        type: 'investment', institution: 'other',     icon: '📈', balance: 15200,   include: false },
    { id: 'meal-card',  name: 'Sodexo Meal Card',     type: 'meal-card',  institution: 'meal-card', icon: '🍽️', balance: 135.50,  include: true, monthlyAllowance: 150, mealProvider: 'sodexo' },
  ],
  daysOfHistory: 90,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function subDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - days)
  return d.toISOString().slice(0, 10)
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function isoDate(y: number, m: number, day: number): string {
  return new Date(y, m, day).toISOString().slice(0, 10)
}

// Deterministic seeded "pseudo-random" — avoids Math.random for stable demo data
function seededPick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length]
}

// ── Checking account transactions ─────────────────────────────────────────────

function generateCheckingTransactions(prefix: string, days: number, todayStr: string): Transaction[] {
  const txs: Transaction[] = []

  for (let i = 0; i < days; i++) {
    const dateStr = subDays(todayStr, i)
    const d       = new Date(dateStr)
    const day     = d.getDate()

    // Coffee: every 3 days
    if (i % 3 === 0) {
      const opts: [string, number][] = [['Delta Q', -2.50], ['Starbucks', -4.80], ['Pastelaria Local', -1.80]]
      const [m, amt] = seededPick(opts, Math.floor(i / 3))
      txs.push({ id: `${prefix}-coffee-${i}`, date: dateStr, merchant: m, amount: amt, category: 'coffee', description: `${m} purchase` })
    }

    // Groceries: every 4 days
    if (i % 4 === 0) {
      const opts: [string, number][] = [['Pingo Doce', -65], ['Continente', -89], ['Lidl', -43], ['Aldi', -38]]
      const [m, amt] = seededPick(opts, Math.floor(i / 4))
      txs.push({ id: `${prefix}-groc1-${i}`, date: dateStr, merchant: m, amount: amt, category: 'groceries', description: `${m} groceries` })
    }

    // More groceries: every 7 days offset 3
    if (i % 7 === 3) {
      const opts: [string, number][] = [['Pingo Doce', -52], ['Mercadona', -71], ['Lidl', -38], ['Aldi', -45]]
      const [m, amt] = seededPick(opts, Math.floor(i / 7))
      txs.push({ id: `${prefix}-groc2-${i}`, date: dateStr, merchant: m, amount: amt, category: 'groceries', description: `${m} groceries` })
    }

    // Dining: every 3 days offset 1
    if (i % 3 === 1) {
      const opts: [string, number][] = [["McDonald's", -9.50], ["Nando's Lisboa", -18.90], ['Tasca do Chico', -24.50], ['Glovo', -16.50]]
      const [m, amt] = seededPick(opts, Math.floor(i / 3))
      txs.push({ id: `${prefix}-dining-${i}`, date: dateStr, merchant: m, amount: amt, category: 'dining', description: `${m} meal` })
    }

    // Transport: every 3 days offset 2
    if (i % 3 === 2) {
      const opts: [string, number][] = [['Uber', -8.40], ['Carris Metro', -1.65], ['Bolt', -6.80]]
      const [m, amt] = seededPick(opts, Math.floor(i / 3))
      txs.push({ id: `${prefix}-transport-${i}`, date: dateStr, merchant: m, amount: amt, category: 'transport', description: `${m} ride` })
    }

    // Shopping: every 14 days offset 5
    if (i % 14 === 5) {
      const opts: [string, number][] = [['Amazon', -34.90], ['Zara', -59.90], ['H&M', -29.90]]
      const [m, amt] = seededPick(opts, Math.floor(i / 14))
      txs.push({ id: `${prefix}-shopping-${i}`, date: dateStr, merchant: m, amount: amt, category: 'shopping', description: `${m} purchase` })
    }

    // Healthcare: every 30 days offset 10
    if (i % 30 === 10) {
      const opts: [string, number][] = [['Farmácia Moderna', -18.50], ['Farmácia Saúde', -12.90]]
      const [m, amt] = seededPick(opts, Math.floor(i / 30))
      txs.push({ id: `${prefix}-health-${i}`, date: dateStr, merchant: m, amount: amt, category: 'healthcare', description: `${m} purchase` })
    }

    // Monthly: salary on 1st
    if (day === 1) {
      txs.push({ id: `${prefix}-salary-${dateStr}`, date: dateStr, merchant: 'Empresa Lda', amount: 2800, category: 'income', description: 'Monthly salary' })
    }

    // Subscriptions on fixed days
    if (day === 5)  txs.push({ id: `${prefix}-netflix-${dateStr}`,  date: dateStr, merchant: 'Netflix',     amount: -15.99, category: 'entertainment', description: 'Netflix subscription' })
    if (day === 6)  txs.push({ id: `${prefix}-spotify-${dateStr}`,  date: dateStr, merchant: 'Spotify',     amount: -9.99,  category: 'entertainment', description: 'Spotify subscription' })
    if (day === 7)  txs.push({ id: `${prefix}-icloud-${dateStr}`,   date: dateStr, merchant: 'Apple iCloud',amount: -2.99,  category: 'entertainment', description: 'iCloud storage' })
    if (day === 15) txs.push({ id: `${prefix}-edp-${dateStr}`,      date: dateStr, merchant: 'EDP Energia', amount: -89,    category: 'utilities',     description: 'Electricity bill' })
    if (day === 16) txs.push({ id: `${prefix}-nos-${dateStr}`,      date: dateStr, merchant: 'NOS Fibra',   amount: -45,    category: 'utilities',     description: 'Internet bill' })
    if (day === 17) txs.push({ id: `${prefix}-agua-${dateStr}`,     date: dateStr, merchant: 'Água EPAL',   amount: -28,    category: 'utilities',     description: 'Water bill' })
  }

  txs.sort((a, b) => b.date.localeCompare(a.date))
  return txs
}

// ── Savings account transactions ──────────────────────────────────────────────

function generateSavingsTransactions(prefix: string, days: number, todayStr: string): Transaction[] {
  const txs: Transaction[] = []
  const today = new Date(todayStr)

  // Generate monthly transfers for every month in range
  const monthsBack = Math.ceil(days / 30) + 1
  for (let m = 0; m < monthsBack; m++) {
    const d = new Date(today.getFullYear(), today.getMonth() - m, 1)
    const dateStr = isoDate(d.getFullYear(), d.getMonth(), 1)
    if (dateStr >= subDays(todayStr, days)) {
      txs.push({ id: `${prefix}-transfer-${dateStr}`, date: dateStr, merchant: 'Transfer In', amount: 500, category: 'savings', description: 'Monthly savings' })
    }
  }

  txs.sort((a, b) => b.date.localeCompare(a.date))
  return txs
}

// ── Investment account transactions ───────────────────────────────────────────

function generateInvestmentTransactions(prefix: string, days: number, todayStr: string): Transaction[] {
  const txs: Transaction[] = []
  const today = new Date(todayStr)
  const monthsBack = Math.ceil(days / 30) + 1

  for (let m = 0; m < monthsBack; m++) {
    const d = new Date(today.getFullYear(), today.getMonth() - m, 25)
    const dateStr = isoDate(d.getFullYear(), d.getMonth(), 25)
    if (dateStr >= subDays(todayStr, days) && dateStr <= todayStr) {
      txs.push({
        id: `${prefix}-buy-${dateStr}`,
        date: dateStr,
        merchant: 'VWCE ETF Purchase',
        amount: -300,
        category: 'investment',
        description: 'Monthly ETF contribution',
      })
    }

    // Quarterly dividend (March, June, Sep, Dec → approx month % 3 === 0)
    const month = d.getMonth()
    if ([2, 5, 8, 11].includes(month)) {
      const divDate = isoDate(d.getFullYear(), d.getMonth(), 10)
      if (divDate >= subDays(todayStr, days) && divDate <= todayStr) {
        txs.push({
          id: `${prefix}-div-${divDate}`,
          date: divDate,
          merchant: 'VWCE Dividend',
          amount: +(45 + m * 1.5).toFixed(2),
          category: 'income',
          description: 'ETF quarterly dividend',
        })
      }
    }
  }

  txs.sort((a, b) => b.date.localeCompare(a.date))
  return txs
}

// ── Meal card transactions ────────────────────────────────────────────────────

function generateMealCardTransactions(prefix: string, days: number, todayStr: string): Transaction[] {
  const txs: Transaction[] = []
  const restaurantOptions: [string, number][] = [
    ['Restaurante Aliança',  -8.90],
    ['Tasca Central',        -10.50],
    ['Cantina Universitária',-6.00],
    ['Bifanas do Chico',     -7.50],
    ['Snack Bar Saudade',    -9.80],
    ['Restaurante Local',    -11.40],
    ['Pingo Doce Deli',      -12.00],
  ]

  for (let i = 0; i < days; i++) {
    const dateStr = subDays(todayStr, i)
    const dow     = new Date(dateStr).getDay()  // 0=Sun, 6=Sat
    if (dow === 0 || dow === 6) continue         // no meals on weekends
    const [m, amt] = seededPick(restaurantOptions, i)
    txs.push({ id: `${prefix}-meal-${i}`, date: dateStr, merchant: m, amount: amt, category: 'dining', description: `${m} meal` })
  }

  txs.sort((a, b) => b.date.localeCompare(a.date))
  return txs
}

// ── Balance history ────────────────────────────────────────────────────────────

function buildBalanceHistory(finalBalance: number, days: number, todayStr: string, type: string): BalancePoint[] {
  const points = Math.min(8, Math.ceil(days / 30) + 2)
  const history: BalancePoint[] = []

  for (let i = points - 1; i >= 0; i--) {
    const date = i === 0 ? todayStr : subDays(todayStr, Math.round((days / (points - 1)) * i))
    let balance: number

    if (type === 'investment') {
      // Compound-like growth: roughly 0.8%/month
      const monthsAgo = (i / (points - 1)) * (days / 30)
      balance = Math.round(finalBalance / Math.pow(1.008, monthsAgo))
    } else if (type === 'savings') {
      // Linear accumulation
      balance = Math.round(finalBalance * (1 - (i / (points - 1)) * 0.3))
    } else {
      // Checking: fluctuates around a mean
      const offset = (i / (points - 1)) * 0.4 * finalBalance
      balance = Math.round(finalBalance * 0.85 + offset * ((i % 2 === 0) ? 0.8 : 1.2))
    }

    history.push({ date, balance: Math.round(balance * 100) / 100 })
  }

  return history
}

// ── Main export ───────────────────────────────────────────────────────────────

export function generateDemoData(config?: DemoConfig): Account[] {
  const cfg = config ?? DEFAULT_DEMO_CONFIG

  const today    = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const curMonth = todayStr.slice(0, 7)

  return cfg.accounts
    .filter(a => a.include)
    .map(acc => {
      let txs: Transaction[] = []

      switch (acc.type) {
        case 'checking':
          txs = generateCheckingTransactions(`demo-${acc.id}`, cfg.daysOfHistory, todayStr)
          break
        case 'savings':
          txs = generateSavingsTransactions(`demo-${acc.id}`, cfg.daysOfHistory, todayStr)
          break
        case 'investment':
          txs = generateInvestmentTransactions(`demo-${acc.id}`, cfg.daysOfHistory, todayStr)
          break
        case 'meal-card':
          txs = generateMealCardTransactions(`demo-${acc.id}`, cfg.daysOfHistory, todayStr)
          break
      }

      const monthlySpend = txs
        .filter(t => t.amount < 0 && t.date.slice(0, 7) === curMonth)
        .reduce((s, t) => s + Math.abs(t.amount), 0)

      const balanceHistory = buildBalanceHistory(acc.balance, cfg.daysOfHistory, todayStr, acc.type)

      const base: Account = {
        id:           `demo-${acc.id}`,
        name:         acc.name,
        type:         acc.type,
        balance:      acc.balance,
        currency:     'EUR',
        institution:  acc.institution,
        status:       'connected',
        icon:         acc.icon,
        lastUpdated:  todayStr,
        monthlySpend: Math.round(monthlySpend * 100) / 100,
        transactions: txs,
        balanceHistory,
      }

      if (acc.type === 'meal-card') {
        base.mealCardSpecific = {
          provider:         acc.mealProvider ?? 'other',
          expiryDate:       `${today.getFullYear() + 1}-12-31`,
          monthlyAllowance: acc.monthlyAllowance ?? 150,
        }
      }

      return base
    })
}
