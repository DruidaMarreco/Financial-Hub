export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  category: string;
  description: string;
}

export interface BalancePoint {
  date: string;
  balance: number;
}

export interface MealCardSpecific {
  provider?: string;
  expiryDate?: string;
  monthlyAllowance?: number;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  institution: string;
  status: string;
  icon: string;
  lastUpdated: string;
  monthlySpend: number;
  transactions: Transaction[];
  balanceHistory: BalancePoint[];
  mealCardSpecific?: MealCardSpecific;
}

function subDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export function generateDemoData(): Account[] {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const currentYearMonth = todayStr.slice(0, 7);

  // Build 90 days of transactions for Account 1
  const acc1Transactions: Transaction[] = [];

  for (let i = 0; i < 90; i++) {
    const dateStr = subDays(todayStr, i);
    const dateObj = new Date(dateStr);
    const dayOfMonth = dateObj.getDate();

    // Coffee: i%3===0
    if (i % 3 === 0) {
      const coffeeOptions: [string, number][] = [
        ['Delta Q', -2.50],
        ['Starbucks', -4.80],
        ['Pastelaria Local', -1.80],
      ];
      const [merchant, amount] = coffeeOptions[Math.floor(i / 3) % 3];
      acc1Transactions.push({
        id: `demo-r1-coffee-${i}`,
        date: dateStr,
        merchant,
        amount,
        category: 'coffee',
        description: `${merchant} purchase`,
      });
    }

    // Groceries: i%4===0
    if (i % 4 === 0) {
      const groceryOptions: [string, number][] = [
        ['Pingo Doce', -65],
        ['Continente', -89],
        ['Lidl', -43],
        ['Aldi', -38],
      ];
      const [merchant, amount] = groceryOptions[Math.floor(i / 4) % 4];
      acc1Transactions.push({
        id: `demo-r1-groc1-${i}`,
        date: dateStr,
        merchant,
        amount,
        category: 'groceries',
        description: `${merchant} groceries`,
      });
    }

    // More groceries: i%7===3
    if (i % 7 === 3) {
      const groceryOptions: [string, number][] = [
        ['Pingo Doce', -65],
        ['Continente', -89],
        ['Lidl', -43],
        ['Aldi', -38],
      ];
      const [merchant, amount] = groceryOptions[Math.floor(i / 7) % 4];
      acc1Transactions.push({
        id: `demo-r1-groc2-${i}`,
        date: dateStr,
        merchant,
        amount,
        category: 'groceries',
        description: `${merchant} groceries`,
      });
    }

    // Dining: i%3===1
    if (i % 3 === 1) {
      const diningOptions: [string, number][] = [
        ["McDonald's", -9.50],
        ['Nando\'s Lisboa', -18.90],
        ['Tasca do Chico', -24.50],
        ['Glovo', -16.50],
      ];
      const [merchant, amount] = diningOptions[Math.floor(i / 3) % 4];
      acc1Transactions.push({
        id: `demo-r1-dining-${i}`,
        date: dateStr,
        merchant,
        amount,
        category: 'dining',
        description: `${merchant} meal`,
      });
    }

    // Transport: i%3===2
    if (i % 3 === 2) {
      const transportOptions: [string, number][] = [
        ['Uber', -8.40],
        ['Carris Metro', -1.65],
        ['Bolt', -6.80],
      ];
      const [merchant, amount] = transportOptions[Math.floor(i / 3) % 3];
      acc1Transactions.push({
        id: `demo-r1-transport-${i}`,
        date: dateStr,
        merchant,
        amount,
        category: 'transport',
        description: `${merchant} ride`,
      });
    }

    // Shopping: i%14===5
    if (i % 14 === 5) {
      const shoppingOptions: [string, number][] = [
        ['Amazon', -34.90],
        ['Zara', -59.90],
        ['H&M', -29.90],
      ];
      const [merchant, amount] = shoppingOptions[Math.floor(i / 14) % 3];
      acc1Transactions.push({
        id: `demo-r1-shopping-${i}`,
        date: dateStr,
        merchant,
        amount,
        category: 'shopping',
        description: `${merchant} purchase`,
      });
    }

    // Healthcare: i%30===10
    if (i % 30 === 10) {
      const healthOptions: [string, number][] = [
        ['Farmácia Moderna', -18.50],
        ['Farmácia Saúde', -12.90],
      ];
      const [merchant, amount] = healthOptions[Math.floor(i / 30) % 2];
      acc1Transactions.push({
        id: `demo-r1-health-${i}`,
        date: dateStr,
        merchant,
        amount,
        category: 'healthcare',
        description: `${merchant} purchase`,
      });
    }

    // Salary on 1st of each month
    if (dayOfMonth === 1) {
      acc1Transactions.push({
        id: `demo-r1-salary-${dateStr}`,
        date: dateStr,
        merchant: 'Empresa Lda',
        amount: 2800,
        category: 'income',
        description: 'Monthly salary',
      });
    }

    // Netflix on 5th
    if (dayOfMonth === 5) {
      acc1Transactions.push({
        id: `demo-r1-netflix-${dateStr}`,
        date: dateStr,
        merchant: 'Netflix',
        amount: -15.99,
        category: 'entertainment',
        description: 'Netflix subscription',
      });
    }

    // Spotify on 6th
    if (dayOfMonth === 6) {
      acc1Transactions.push({
        id: `demo-r1-spotify-${dateStr}`,
        date: dateStr,
        merchant: 'Spotify',
        amount: -9.99,
        category: 'entertainment',
        description: 'Spotify subscription',
      });
    }

    // Apple iCloud on 7th
    if (dayOfMonth === 7) {
      acc1Transactions.push({
        id: `demo-r1-icloud-${dateStr}`,
        date: dateStr,
        merchant: 'Apple iCloud',
        amount: -2.99,
        category: 'entertainment',
        description: 'Apple iCloud storage',
      });
    }

    // EDP Energia on 15th
    if (dayOfMonth === 15) {
      acc1Transactions.push({
        id: `demo-r1-edp-${dateStr}`,
        date: dateStr,
        merchant: 'EDP Energia',
        amount: -89,
        category: 'utilities',
        description: 'Electricity bill',
      });
    }

    // NOS Fibra on 16th
    if (dayOfMonth === 16) {
      acc1Transactions.push({
        id: `demo-r1-nos-${dateStr}`,
        date: dateStr,
        merchant: 'NOS Fibra',
        amount: -45,
        category: 'utilities',
        description: 'Internet bill',
      });
    }

    // Água EPAL on 17th
    if (dayOfMonth === 17) {
      acc1Transactions.push({
        id: `demo-r1-agua-${dateStr}`,
        date: dateStr,
        merchant: 'Água EPAL',
        amount: -28,
        category: 'utilities',
        description: 'Water bill',
      });
    }
  }

  // Sort descending by date
  acc1Transactions.sort((a, b) => b.date.localeCompare(a.date));

  // Monthly spend = sum of abs(negative amounts) for current month
  const acc1MonthlySpend = acc1Transactions
    .filter(t => t.amount < 0 && t.date.slice(0, 7) === currentYearMonth)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Balance history for Account 1: 6 points from 5 months ago to now
  const acc1BalanceHistory: BalancePoint[] = [
    { date: subDays(todayStr, 150), balance: 1200 },
    { date: subDays(todayStr, 120), balance: 1450 },
    { date: subDays(todayStr, 90), balance: 1780 },
    { date: subDays(todayStr, 60), balance: 2100 },
    { date: subDays(todayStr, 30), balance: 2280 },
    { date: todayStr, balance: 2450.80 },
  ];

  // Account 2 dates
  const currentMonth1st = todayStr.slice(0, 8) + '01';
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonth1st = lastMonthDate.toISOString().slice(0, 10);
  const twoMonthsDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  const twoMonths1st = twoMonthsDate.toISOString().slice(0, 10);

  const acc2Transactions: Transaction[] = [
    {
      id: 'demo-s1',
      date: currentMonth1st,
      merchant: 'Transfer from Revolut',
      amount: 500,
      category: 'savings',
      description: 'Monthly savings',
    },
    {
      id: 'demo-s2',
      date: lastMonth1st,
      merchant: 'Transfer from Revolut',
      amount: 500,
      category: 'savings',
      description: 'Monthly savings',
    },
    {
      id: 'demo-s3',
      date: twoMonths1st,
      merchant: 'Transfer from Revolut',
      amount: 500,
      category: 'savings',
      description: 'Monthly savings',
    },
  ];

  const acc2BalanceHistory: BalancePoint[] = [
    { date: twoMonths1st, balance: 7200 },
    { date: lastMonth1st, balance: 7700 },
    { date: currentMonth1st, balance: 8200 },
  ];

  // Account 3 meal card transactions
  const acc3Transactions: Transaction[] = [
    {
      id: 'demo-m1',
      date: todayStr,
      merchant: 'Restaurante Local',
      amount: -8.90,
      category: 'dining',
      description: 'Restaurante Local meal',
    },
    {
      id: 'demo-m2',
      date: subDays(todayStr, 1),
      merchant: 'Restaurante Local',
      amount: -10.50,
      category: 'dining',
      description: 'Restaurante Local meal',
    },
    {
      id: 'demo-m3',
      date: subDays(todayStr, 2),
      merchant: 'Restaurante Local',
      amount: -12.00,
      category: 'dining',
      description: 'Restaurante Local meal',
    },
    {
      id: 'demo-m4',
      date: subDays(todayStr, 3),
      merchant: 'Restaurante Local',
      amount: -9.80,
      category: 'dining',
      description: 'Restaurante Local meal',
    },
    {
      id: 'demo-m5',
      date: subDays(todayStr, 4),
      merchant: 'Restaurante Local',
      amount: -11.40,
      category: 'dining',
      description: 'Restaurante Local meal',
    },
  ];

  const acc3BalanceHistory: BalancePoint[] = [
    { date: currentMonth1st, balance: 150 },
    { date: subDays(todayStr, 3), balance: 141.10 },
    { date: todayStr, balance: 135.50 },
  ];

  return [
    {
      id: 'demo-revolut-1',
      name: 'My Revolut',
      type: 'checking',
      balance: 2450.80,
      currency: 'EUR',
      institution: 'revolut',
      status: 'connected',
      icon: '🟦',
      lastUpdated: todayStr,
      monthlySpend: acc1MonthlySpend,
      transactions: acc1Transactions,
      balanceHistory: acc1BalanceHistory,
    },
    {
      id: 'demo-savings-1',
      name: 'Savings Account',
      type: 'savings',
      balance: 8200,
      currency: 'EUR',
      institution: 'cgd',
      status: 'connected',
      icon: '🏦',
      lastUpdated: todayStr,
      monthlySpend: 0,
      transactions: acc2Transactions,
      balanceHistory: acc2BalanceHistory,
    },
    {
      id: 'demo-meal-1',
      name: 'Sodexo Meal Card',
      type: 'meal-card',
      balance: 135.50,
      currency: 'EUR',
      institution: 'meal-card',
      status: 'connected',
      icon: '🍽️',
      lastUpdated: todayStr,
      monthlySpend: 14.50,
      transactions: acc3Transactions,
      balanceHistory: acc3BalanceHistory,
      mealCardSpecific: {
        provider: 'sodexo',
        expiryDate: '2026-12-31',
        monthlyAllowance: 150,
      },
    },
  ];
}
