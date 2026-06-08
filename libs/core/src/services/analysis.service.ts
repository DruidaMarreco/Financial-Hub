import { Portfolio, PortfolioMetrics, Transaction } from '../models';

export interface FinancialInsights {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  topExpenseCategories: Array<{ category: string; amount: number }>;
}

export interface IAnalysisService {
  // Portfolio analysis
  calculatePortfolioMetrics(portfolioId: string): Promise<PortfolioMetrics>;
  getPortfolioAllocation(portfolioId: string): Promise<Record<string, number>>;

  // Financial insights
  getFinancialInsights(userId: string, period: 'month' | 'quarter' | 'year'): Promise<FinancialInsights>;
  getNetWorth(userId: string): Promise<number>;

  // Trend analysis
  getTransactionTrends(accountId: string, days: number): Promise<Array<{ date: Date; amount: number }>>;
  getSpendingTrends(userId: string, period: 'month' | 'quarter' | 'year'): Promise<Record<string, number[]>>;

  // Recommendations
  getFinancialRecommendations(userId: string): Promise<string[]>;
}
