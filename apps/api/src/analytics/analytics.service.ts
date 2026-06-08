import { Injectable } from '@nestjs/common';
import { PrismaService } from '@financial-hub/data';
import { Forecaster } from '../ml/forecaster';
import { AnomalyDetector } from '../ml/anomaly-detector';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private forecaster: Forecaster,
    private anomalyDetector: AnomalyDetector,
  ) {}

  async getNetWorthTimeSeries(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });

    // Simulate net worth history (in production, track snapshots)
    return {
      data: accounts.map(a => ({
        date: a.createdAt,
        netWorth: a.balance,
      })),
      current: accounts.reduce((sum, a) => sum + a.balance, 0),
    };
  }

  async getCashFlowData(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { userId },
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const byCategory = new Map<string, number>();
    for (const tx of transactions.filter(t => t.type === 'expense')) {
      byCategory.set(
        tx.category,
        (byCategory.get(tx.category) || 0) + Math.abs(tx.amount),
      );
    }

    return {
      income,
      expenses,
      savings: income - expenses,
      savingsRate: income > 0 ? (income - expenses) / income : 0,
      byCategory: Object.fromEntries(byCategory),
    };
  }

  async getExpenseHeatmap(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { userId },
        date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
    });

    const heatmap = new Map<string, Map<string, number>>();

    for (const tx of transactions) {
      const date = new Date(tx.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!heatmap.has(month)) {
        heatmap.set(month, new Map());
      }

      const monthMap = heatmap.get(month)!;
      monthMap.set(
        tx.category,
        (monthMap.get(tx.category) || 0) + Math.abs(tx.amount),
      );
    }

    return Object.fromEntries(
      Array.from(heatmap).map(([month, categories]) => [
        month,
        Object.fromEntries(categories),
      ]),
    );
  }

  async getSpendingForecast(userId: string, monthsAhead: number = 6) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { userId },
        date: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
      },
    });

    return this.forecaster.forecastSpending(transactions, monthsAhead);
  }

  async getFinancialGoals(userId: string) {
    // Calculate key metrics
    const accounts = await this.prisma.account.findMany({
      where: { userId },
    });

    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { userId },
        date: { gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const netWorth = accounts.reduce((sum, a) => sum + a.balance, 0);
    const monthlyExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0) / 12;

    const annualExpenses = monthlyExpenses * 12;
    const fiNumber = this.forecaster.calculateFINumber(annualExpenses);
    const runway = this.forecaster.calculateRunway(monthlyExpenses, netWorth);

    return {
      netWorth,
      monthlyExpenses,
      annualExpenses,
      fiNumber,
      fiProgress: (netWorth / fiNumber) * 100,
      runway: runway.months,
      runoutDate: runway.date,
      savingsRate: transactions.length > 0
        ? (transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) -
           transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Math.abs(t.amount), 0)) /
          transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 1)
        : 0,
    };
  }

  async getInvestmentMetrics(userId: string) {
    const portfolios = await this.prisma.portfolio.findMany({
      where: { userId },
      include: { holdings: true, metrics: true },
    });

    return {
      portfolios: portfolios.map(p => ({
        name: p.name,
        totalValue: p.totalValue,
        metrics: p.metrics || {},
        holdings: p.holdings.length,
      })),
    };
  }
}
