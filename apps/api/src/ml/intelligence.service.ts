import { Injectable } from '@nestjs/common';
import { PrismaService } from '@financial-hub/data';
import { LSTMForecaster } from './lstm-forecaster';
import { IsolationForest } from './isolation-forest';
import { RecommendationEngine, Recommendation } from './recommendation-engine';

@Injectable()
export class IntelligenceService {
  constructor(
    private prisma: PrismaService,
    private lstmForecaster: LSTMForecaster,
    private isolationForest: IsolationForest,
    private recommendations: RecommendationEngine,
  ) {}

  async getAdvancedInsights(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
    });

    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { userId },
        date: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
      },
    });

    if (transactions.length === 0) {
      return {
        forecasts: [],
        patterns: null,
        groups: [],
        recommendations: [],
        insights: [],
      };
    }

    // Advanced forecasting
    const forecasts = await this.lstmForecaster.forecastWithLSTM(transactions, 6);

    // Pattern detection
    const patterns = this.lstmForecaster.detectPatterns(transactions);

    // Transaction clustering
    const groups = this.isolationForest.findTransactionGroups(transactions);

    // AI-powered recommendations
    const recs = await this.recommendations.generateRecommendations(userId, transactions, accounts);

    return {
      forecasts,
      patterns,
      groups,
      recommendations: recs,
      insights: this.generateInsights(forecasts, groups, transactions),
    };
  }

  async getRecommendations(userId: string): Promise<Recommendation[]> {
    const accounts = await this.prisma.account.findMany({ where: { userId } });
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { userId },
        date: { gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) },
      },
    });

    return this.recommendations.generateRecommendations(userId, transactions, accounts);
  }

  async getAdvancedAnomalies(userId: string) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        account: { userId },
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const historicalTransactions = await this.prisma.transaction.findMany({
      where: {
        account: { userId },
        date: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      take: 500,
    });

    const anomalies = [];

    for (const tx of transactions) {
      const result = await this.isolationForest.detectAnomalyAdvanced(tx, historicalTransactions);

      if (result.isAnomaly || result.anomalyScore > 0.7) {
        await this.prisma.transaction.update({
          where: { id: tx.id },
          data: {
            anomalyScore: result.anomalyScore,
            isAnomaly: result.isAnomaly,
          },
        });

        anomalies.push({
          transaction: tx,
          ...result,
        });
      }
    }

    return anomalies;
  }

  private generateInsights(forecasts: any[], groups: any[], transactions: any[]): string[] {
    const insights: string[] = [];

    // Forecast insights
    for (const forecast of forecasts) {
      if (forecast.trend === 'increasing') {
        insights.push(`Your ${forecast.category} spending is trending upward. Monitor this closely.`);
      } else if (forecast.trend === 'decreasing') {
        insights.push(`Great job! Your ${forecast.category} spending is trending downward.`);
      }

      if (forecast.seasonality > 0.5) {
        insights.push(`Strong seasonal pattern detected in ${forecast.category}. Plan ahead for peak months.`);
      }
    }

    // Group insights
    const topGroups = groups.slice(0, 3);
    for (const group of topGroups) {
      insights.push(`Your most frequent transaction: ${group.name} (${group.frequency})`);
    }

    // General insights
    if (transactions.length > 100) {
      const avgTransaction = transactions.reduce((sum: number, t: any) => sum + Math.abs(t.amount), 0) / transactions.length;
      insights.push(`Your average transaction is $${avgTransaction.toFixed(2)}`);
    }

    return insights.slice(0, 5); // Top 5 insights
  }
}
