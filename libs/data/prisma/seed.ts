import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with demo data...');

  // Clean existing data (careful in production!)
  await prisma.syncLog.deleteMany({});
  await prisma.bankIntegration.deleteMany({});
  await prisma.balanceHistory.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.holding.deleteMany({});
  await prisma.portfolioMetrics.deleteMany({});
  await prisma.portfolio.deleteMany({});
  await prisma.transactionCategory.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.userProfile.deleteMany({});
  await prisma.user.deleteMany({});

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123456', 10);
  const user = await prisma.user.create({
    data: {
      email: 'demo@financialhub.io',
      name: 'Demo User',
      password: hashedPassword,
    },
  });

  console.log(`✅ Created demo user: ${user.email}`);

  // Create user profile
  const profile = await prisma.userProfile.create({
    data: {
      userId: user.id,
      preferredCurrency: 'EUR',
      timezone: 'Europe/Lisbon',
      language: 'en',
    },
  });

  console.log(`✅ Created user profile`);

  // Create demo accounts
  const account1 = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Checking Account',
      accountNumber: 'PT50123456789012345678901',
      type: 'bank',
      status: 'active',
      balance: 5000,
      currency: 'EUR',
      institution: 'cgd',
      monthlySpend: 1200,
    },
  });

  const account2 = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Savings Account',
      accountNumber: 'PT50987654321098765432109',
      type: 'savings',
      status: 'active',
      balance: 15000,
      currency: 'EUR',
      institution: 'cgd',
    },
  });

  const account3 = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Credit Card',
      accountNumber: '4532012345678901',
      type: 'credit_card',
      status: 'active',
      balance: -500,
      currency: 'EUR',
      institution: 'revolut',
    },
  });

  const account4 = await prisma.account.create({
    data: {
      userId: user.id,
      name: 'Investment Account',
      accountNumber: 'INV-123456',
      type: 'investment',
      status: 'active',
      balance: 25000,
      currency: 'EUR',
      institution: 'other',
    },
  });

  console.log(`✅ Created 4 demo accounts`);

  // Create transaction categories
  const categories = [
    { name: 'Groceries', color: '#10b981', icon: '🛒' },
    { name: 'Dining', color: '#f59e0b', icon: '🍽️' },
    { name: 'Transport', color: '#3b82f6', icon: '🚌' },
    { name: 'Entertainment', color: '#8b5cf6', icon: '🎬' },
    { name: 'Shopping', color: '#ec4899', icon: '🛍️' },
    { name: 'Utilities', color: '#14b8a6', icon: '💡' },
    { name: 'Healthcare', color: '#ef4444', icon: '💊' },
    { name: 'Income', color: '#22c55e', icon: '💰' },
    { name: 'Savings', color: '#06b6d4', icon: '💾' },
  ];

  for (const cat of categories) {
    await prisma.transactionCategory.create({
      data: {
        userId: user.id,
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        order: categories.indexOf(cat),
      },
    });
  }

  console.log(`✅ Created ${categories.length} transaction categories`);

  // Create demo transactions
  const merchants = [
    { name: 'Continente Hipermercados', category: 'Groceries', amount: 45.50 },
    { name: 'Starbucks Coffee', category: 'Dining', amount: 5.20 },
    { name: 'Uber Portugal', category: 'Transport', amount: 12.80 },
    { name: 'Netflix Subscription', category: 'Entertainment', amount: 15.99 },
    { name: 'ZARA Store', category: 'Shopping', amount: 89.99 },
    { name: 'EDP Electricity', category: 'Utilities', amount: 95.00 },
    { name: 'Pharmacopia', category: 'Healthcare', amount: 23.50 },
    { name: 'Employer Salary', category: 'Income', amount: 3500.00 },
    { name: 'Pingo Doce', category: 'Groceries', amount: 32.15 },
    { name: 'Futebol Clube', category: 'Entertainment', amount: 45.00 },
  ];

  const now = new Date();
  const transactions = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const merchant = merchants[i % merchants.length];
    const isIncome = merchant.category === 'Income';

    transactions.push({
      accountId: isIncome ? account4.id : account1.id,
      amount: isIncome ? merchant.amount : -merchant.amount,
      currency: 'EUR',
      type: isIncome ? 'income' : 'expense',
      description: merchant.name,
      category: merchant.category.toLowerCase().replace(' ', '_'),
      categoryConfidence: 0.95,
      merchant: merchant.name,
      date,
      tags: [],
      anomalyScore: Math.random() * 0.3,
      isAnomaly: Math.random() > 0.9,
    });
  }

  for (const tx of transactions) {
    await prisma.transaction.create({ data: tx });
  }

  console.log(`✅ Created ${transactions.length} demo transactions`);

  // Create demo portfolio
  const portfolio = await prisma.portfolio.create({
    data: {
      userId: user.id,
      name: 'My Investment Portfolio',
      description: 'Long-term investment portfolio',
      totalValue: 25000,
      currency: 'EUR',
    },
  });

  console.log(`✅ Created demo portfolio`);

  // Create demo holdings
  const holdings = [
    { symbol: 'AAPL', name: 'Apple Inc.', quantity: 10, purchasePrice: 150, currentPrice: 180 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', quantity: 8, purchasePrice: 300, currentPrice: 380 },
    { symbol: 'VOW3.DE', name: 'Vanguard FTSE All-World (EUR)', quantity: 25, purchasePrice: 88, currentPrice: 95 },
  ];

  for (const h of holdings) {
    await prisma.holding.create({
      data: {
        portfolioId: portfolio.id,
        accountId: account4.id,
        symbol: h.symbol,
        name: h.name,
        quantity: h.quantity,
        purchasePrice: h.purchasePrice,
        currentPrice: h.currentPrice,
        purchaseDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // 1 year ago
        currency: 'EUR',
      },
    });
  }

  console.log(`✅ Created ${holdings.length} demo holdings`);

  // Create portfolio metrics
  const totalInvested = holdings.reduce((sum, h) => sum + h.quantity * h.purchasePrice, 0);
  const totalValue = holdings.reduce((sum, h) => sum + h.quantity * h.currentPrice, 0);

  await prisma.portfolioMetrics.create({
    data: {
      portfolioId: portfolio.id,
      totalInvested,
      totalValue,
      totalGain: totalValue - totalInvested,
      gainPercentage: ((totalValue - totalInvested) / totalInvested) * 100,
      dayChange: 250,
      dayChangePercentage: 1.05,
    },
  });

  console.log(`✅ Created portfolio metrics`);

  // Create balance history
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    await prisma.balanceHistory.create({
      data: {
        accountId: account1.id,
        balance: 5000 + Math.random() * 500,
        currency: 'EUR',
        recordedAt: date,
      },
    });
  }

  console.log(`✅ Created balance history`);

  console.log('\n✅ 🌱 Database seeded successfully!');
  console.log('\n📝 Demo credentials:');
  console.log(`   Email: demo@financialhub.io`);
  console.log(`   Password: demo123456`);
  console.log('\n💰 Demo data:');
  console.log(`   Total balance: €${5000 + 15000 - 500 + 25000}`);
  console.log(`   Transactions: 30`);
  console.log(`   Portfolio value: €${totalValue.toFixed(2)}`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
