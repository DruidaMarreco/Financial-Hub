import { Injectable } from '@nestjs/common';

interface Transaction {
  amount: number;
  category: string;
  date: Date;
}

interface LSTMForecast {
  category: string;
  predictions: Array<{ month: string; predicted: number; confidence: number }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: number; // 0-1, strength of seasonal pattern
}

@Injectable()
export class LSTMForecaster {
  /**
   * Advanced LSTM-style forecasting with trend and seasonality
   * (Simplified implementation - ready for TensorFlow.js or actual LSTM)
   */
  async forecastWithLSTM(transactions: Transaction[], monthsAhead: number = 6): Promise<LSTMForecast[]> {
    const byCategory = this.groupByCategory(transactions);
    const forecasts: LSTMForecast[] = [];

    for (const [category, categoryTxs] of byCategory) {
      const monthlyAmounts = this.extractMonthlyTimeSeries(categoryTxs);

      if (monthlyAmounts.length < 6) {
        continue; // Need at least 6 months for LSTM
      }

      const trend = this.calculateTrend(monthlyAmounts);
      const seasonality = this.detectSeasonality(monthlyAmounts);
      const predictions = this.forecastWithTrendSeasonality(monthlyAmounts, trend, seasonality, monthsAhead);

      forecasts.push({
        category,
        predictions,
        trend,
        seasonality,
      });
    }

    return forecasts;
  }

  private groupByCategory(transactions: Transaction[]): Map<string, Transaction[]> {
    const grouped = new Map<string, Transaction[]>();

    for (const tx of transactions) {
      if (!grouped.has(tx.category)) {
        grouped.set(tx.category, []);
      }
      grouped.get(tx.category)!.push(tx);
    }

    return grouped;
  }

  private extractMonthlyTimeSeries(transactions: Transaction[]): number[] {
    const monthlyMap = new Map<string, number>();

    for (const tx of transactions) {
      const date = new Date(tx.date);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(month, (monthlyMap.get(month) || 0) + Math.abs(tx.amount));
    }

    return Array.from(monthlyMap.values()).sort((a, b) => a - b);
  }

  private calculateTrend(series: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (series.length < 3) return 'stable';

    const recent = series.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const older = series.slice(0, 3).reduce((a, b) => a + b, 0) / 3;

    const change = (recent - older) / older;

    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  private detectSeasonality(series: number[]): number {
    if (series.length < 12) return 0;

    // Simple seasonality detection: correlation with 12-month lag
    const recent = series.slice(-12);
    const previous = series.slice(-24, -12);

    if (previous.length !== recent.length) return 0;

    const correlation = this.calculateCorrelation(previous, recent);
    return Math.max(0, correlation); // Only positive correlation indicates seasonality
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const meanX = x.reduce((a, b) => a + b, 0) / x.length;
    const meanY = y.reduce((a, b) => a + b, 0) / y.length;

    let numerator = 0;
    let sumX = 0;
    let sumY = 0;

    for (let i = 0; i < x.length; i++) {
      const dX = x[i] - meanX;
      const dY = y[i] - meanY;
      numerator += dX * dY;
      sumX += dX * dX;
      sumY += dY * dY;
    }

    const denominator = Math.sqrt(sumX * sumY);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private forecastWithTrendSeasonality(
    series: number[],
    trend: 'increasing' | 'decreasing' | 'stable',
    seasonality: number,
    monthsAhead: number,
  ): Array<{ month: string; predicted: number; confidence: number }> {
    const predictions: Array<{ month: string; predicted: number; confidence: number }> = [];
    const base = series[series.length - 1];
    const trendFactor = trend === 'increasing' ? 1.05 : trend === 'decreasing' ? 0.95 : 1.0;

    for (let i = 1; i <= monthsAhead; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      const month = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;

      // Base forecast with trend
      let predicted = base * Math.pow(trendFactor, i);

      // Add seasonality if detected
      if (seasonality > 0.3) {
        const seasonalComponent = series[series.length - 12 + (i % 12)] || series[0];
        predicted = predicted * (1 - seasonality) + seasonalComponent * seasonality;
      }

      // Confidence decreases further ahead
      const confidence = Math.max(0.5, 1 - i * 0.05);

      predictions.push({
        month,
        predicted: Math.max(0, predicted),
        confidence,
      });
    }

    return predictions;
  }

  /**
   * Detect recurring patterns in spending
   */
  detectPatterns(transactions: Transaction[]): {
    weekly: string[];
    monthly: string[];
    quarterly: string[];
  } {
    const patterns = {
      weekly: [] as string[],
      monthly: [] as string[],
      quarterly: [] as string[],
    };

    const byDayOfWeek = new Map<number, number>();
    const byDayOfMonth = new Map<number, number>();

    for (const tx of transactions) {
      const date = new Date(tx.date);

      // Weekly pattern
      const dayOfWeek = date.getDay();
      byDayOfWeek.set(dayOfWeek, (byDayOfWeek.get(dayOfWeek) || 0) + 1);

      // Monthly pattern
      const dayOfMonth = date.getDate();
      byDayOfMonth.set(dayOfMonth, (byDayOfMonth.get(dayOfMonth) || 0) + 1);
    }

    // Find significant weekly patterns
    const avgWeekly = transactions.length / 7;
    for (const [day, count] of byDayOfWeek) {
      if (count > avgWeekly * 1.5) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        patterns.weekly.push(dayNames[day]);
      }
    }

    // Find significant monthly patterns
    const avgMonthly = transactions.length / 30;
    for (const [day, count] of byDayOfMonth) {
      if (count > avgMonthly * 1.5) {
        patterns.monthly.push(`Day ${day} of month`);
      }
    }

    return patterns;
  }
}
