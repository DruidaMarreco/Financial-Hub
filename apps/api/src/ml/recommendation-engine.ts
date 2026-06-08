import { Injectable } from '@nestjs/common';
import { IsolationForest } from './isolation-forest';
import { LSTMForecaster } from './lstm-forecaster';

interface Transaction {
  amount: number;
  category: string;
  date: Date;
  merchant?: string;
}

export interface Recommendation {
  type: 'optimization' | 'insight' | 'warning' | 'opportunity';
  title: string;
  description: string;
  impact: string; // "Save $X/month" or similar
  priority: 'low' | 'medium' | 'high';
  actionable: boolean;
}

@Injectable()
export class RecommendationEngine {
  constructor(
    private isolationForest: IsolationForest,
    private forecaster: LSTMForecaster,
  ) {}

  async generateRecommendations(
    userId: string,
    transactions: Transaction[],
    accounts: any[],
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    if (transactions.length === 0) return recommendations;

    // Analyze spending patterns
    const patterns = this.forecaster.detectPatterns(transactions);
    const groups = this.isolationForest.findTransactionGroups(transactions);
    const categoryStats = this.analyzeCategorySpending(transactions);

    // 1. Spending optimization recommendations
    recommendations.push(...this.optimizationRecommendations(groups, categoryStats));

    // 2. Anomaly insights
    recommendations.push(...this.anomalyInsights(transactions));

    // 3. Saving opportunities
    recommendations.push(...this.savingOpportunities(categoryStats));

    // 4. Pattern-based insights
    recommendations.push(...this.patternInsights(patterns, categoryStats));

    // 5. Emergency fund recommendations
    recommendations.push(...this.emergencyFundRecommendations(transactions, accounts));

    // Sort by priority and impact
    return recommendations.sort((a, b) => {
      const priorityMap = { high: 3, medium: 2, low: 1 };
      return priorityMap[b.priority] - priorityMap[a.priority];
    });
  }

  private optimizationRecommendations(
    groups: any[],
    categoryStats: Record<string, { total: number; count: number; avg: number }>,
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Find categories with high variability
    for (const [category, stats] of Object.entries(categoryStats)) {
      if (stats.count < 5) continue;

      const variance = this.calculateVariance(category, stats);

      if (variance > 0.5 && stats.total > 100) {
        const savings = stats.avg * 0.2; // 20% optimization potential
        recommendations.push({
          type: 'optimization',
          title: `Optimize ${category} spending`,
          description: `Your ${category} spending varies significantly. Set a budget to stabilize costs.`,
          impact: `Potential savings: $${savings.toFixed(2)}/month`,
          priority: stats.total > 500 ? 'high' : 'medium',
          actionable: true,
        });
      }
    }

    return recommendations;
  }

  private anomalyInsights(transactions: Transaction[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Find unusual spending patterns
    const anomalies = transactions.filter(
      t => Math.abs(t.amount) > this.getAmountThreshold(transactions, t.category) * 1.5,
    );

    if (anomalies.length > 0 && anomalies.length < transactions.length * 0.1) {
      recommendations.push({
        type: 'insight',
        title: 'Unusual spending detected',
        description: `You had ${anomalies.length} unusually large transactions. Review to ensure they're expected.`,
        impact: 'Monitor for fraud',
        priority: 'medium',
        actionable: true,
      });
    }

    return recommendations;
  }

  private savingOpportunities(categoryStats: Record<string, { total: number; count: number; avg: number }>): Recommendation[] {
    const recommendations: Recommendation[] = [];

    const sortedCategories = Object.entries(categoryStats)
      .map(([cat, stats]) => ({ category: cat, ...stats }))
      .sort((a, b) => b.total - a.total);

    // Top 3 spending categories
    for (let i = 0; i < Math.min(3, sortedCategories.length); i++) {
      const { category, total, avg } = sortedCategories[i];

      if (category === 'Dining' || category === 'Shopping' || category === 'Entertainment') {
        const reduction = total * 0.15; // 15% reduction potential
        recommendations.push({
          type: 'opportunity',
          title: `Reduce ${category.toLowerCase()} costs`,
          description: `Your ${category.toLowerCase()} is your #${i + 1} expense. A 15% reduction would save $${reduction.toFixed(2)}/month.`,
          impact: `Save $${reduction.toFixed(2)}/month`,
          priority: i === 0 ? 'high' : 'medium',
          actionable: true,
        });
      }
    }

    return recommendations;
  }

  private patternInsights(
    patterns: { weekly: string[]; monthly: string[]; quarterly: string[] },
    categoryStats: Record<string, { total: number; count: number; avg: number }>,
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Weekly spending patterns
    if (patterns.weekly.length > 0) {
      recommendations.push({
        type: 'insight',
        title: `You spend most on ${patterns.weekly.join(', ')}`,
        description: 'Consider setting up reminders on these days to track spending.',
        impact: 'Awareness & control',
        priority: 'low',
        actionable: false,
      });
    }

    // Monthly patterns
    if (patterns.monthly.length > 0) {
      recommendations.push({
        type: 'insight',
        title: `Recurring monthly expenses detected`,
        description: `You consistently spend on ${patterns.monthly.join(', ')}. These might be subscription opportunities.`,
        impact: 'Opportunity to automate',
        priority: 'low',
        actionable: false,
      });
    }

    return recommendations;
  }

  private emergencyFundRecommendations(transactions: Transaction[], accounts: any[]): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // Calculate monthly expenses
    const monthlyExpenses =
      transactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0) / 12;
    const emergencyFundTarget = monthlyExpenses * 6; // 6 months of expenses

    const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
    const fundingPercent = (totalBalance / emergencyFundTarget) * 100;

    if (fundingPercent < 100) {
      recommendations.push({
        type: 'warning',
        title: 'Emergency fund below target',
        description: `You have ${fundingPercent.toFixed(0)}% of recommended emergency fund. Target: $${emergencyFundTarget.toFixed(2)}`,
        impact: `Need $${(emergencyFundTarget - totalBalance).toFixed(2)} more`,
        priority: 'high',
        actionable: true,
      });
    } else if (fundingPercent < 150) {
      recommendations.push({
        type: 'insight',
        title: 'Emergency fund is adequate',
        description: 'You have enough for 6+ months of expenses. Consider investing excess.',
        impact: 'Financial security confirmed',
        priority: 'low',
        actionable: true,
      });
    }

    return recommendations;
  }

  private analyzeCategorySpending(transactions: Transaction[]): Record<string, { total: number; count: number; avg: number }> {
    const stats: Record<string, { total: number; count: number; avg: number }> = {};

    for (const tx of transactions) {
      if (!stats[tx.category]) {
        stats[tx.category] = { total: 0, count: 0, avg: 0 };
      }
      stats[tx.category].total += Math.abs(tx.amount);
      stats[tx.category].count += 1;
    }

    for (const category in stats) {
      stats[category].avg = stats[category].total / stats[category].count;
    }

    return stats;
  }

  private getAmountThreshold(transactions: Transaction[], category: string): number {
    const categoryTxs = transactions.filter(t => t.category === category);
    if (categoryTxs.length === 0) return 100;

    const amounts = categoryTxs.map(t => Math.abs(t.amount));
    return amounts.reduce((a, b) => a + b, 0) / amounts.length;
  }

  private calculateVariance(category: string, stats: any): number {
    return stats.count > 1 ? Math.sqrt(stats.count) / stats.count : 0;
  }
}
