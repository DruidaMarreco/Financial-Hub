import { Injectable } from '@nestjs/common';

interface Transaction {
  id?: string;
  amount: number;
  category: string;
  date: Date;
}

interface AnomalyResult {
  score: number; // 0-1, higher = more anomalous
  isAnomaly: boolean;
  reason: string;
  confidence: number;
}

@Injectable()
export class AnomalyDetector {
  async detectAnomaly(transaction: Transaction, historicalTransactions: Transaction[]): Promise<AnomalyResult> {
    const categoryTransactions = historicalTransactions.filter(t => t.category === transaction.category);

    if (categoryTransactions.length < 5) {
      return { score: 0.2, isAnomaly: false, reason: 'insufficient_history', confidence: 0.4 };
    }

    // Calculate statistics
    const amounts = categoryTransactions.map(t => Math.abs(t.amount));
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const std = Math.sqrt(amounts.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / amounts.length);

    // Z-score anomaly detection
    const zScore = (Math.abs(transaction.amount) - mean) / (std || 1);
    const anomalyScore = Math.min(1, Math.abs(zScore) / 3); // Normalize to 0-1

    // Interquartile range method
    const sorted = amounts.sort((a, b) => a - b);
    const q1 = sorted[Math.floor(sorted.length * 0.25)];
    const q3 = sorted[Math.floor(sorted.length * 0.75)];
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    const isOutlier = Math.abs(transaction.amount) < lowerBound || Math.abs(transaction.amount) > upperBound;

    // Determine if anomaly
    const isAnomaly = zScore > 2.5 || isOutlier;
    const reason = isAnomaly
      ? zScore > 2.5
        ? `z_score_high (${zScore.toFixed(2)})`
        : `outside_iqr_bounds`
      : 'normal';

    return {
      score: Math.min(1, anomalyScore + (isOutlier ? 0.2 : 0)),
      isAnomaly,
      reason,
      confidence: 0.85,
    };
  }

  async detectPatterns(transactions: Transaction[]) {
    const patterns = {
      cyclical: [] as string[],
      trending: [] as { category: string; trend: 'increasing' | 'decreasing' }[],
      unusual: [] as string[],
    };

    // Group by category
    const byCategory = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      if (!byCategory.has(tx.category)) {
        byCategory.set(tx.category, []);
      }
      byCategory.get(tx.category)!.push(tx);
    }

    // Analyze each category
    for (const [category, categoryTxs] of byCategory) {
      // Cyclical pattern detection (weekly, monthly)
      const dayOfWeek = new Map<number, number>();
      for (const tx of categoryTxs) {
        const day = new Date(tx.date).getDay();
        dayOfWeek.set(day, (dayOfWeek.get(day) || 0) + 1);
      }

      const maxDay = Array.from(dayOfWeek.values()).reduce((a, b) => a > b ? a : b, 0);
      const minDay = Array.from(dayOfWeek.values()).reduce((a, b) => a < b ? a : b, Infinity);
      if (maxDay > minDay * 2) {
        patterns.cyclical.push(`${category}_weekly_pattern`);
      }

      // Trend detection
      const last30Days = categoryTxs.slice(-30);
      const first30Days = categoryTxs.slice(0, 30);
      if (last30Days.length > 5 && first30Days.length > 5) {
        const lastAvg = last30Days.reduce((sum, t) => sum + Math.abs(t.amount), 0) / last30Days.length;
        const firstAvg = first30Days.reduce((sum, t) => sum + Math.abs(t.amount), 0) / first30Days.length;
        if (lastAvg > firstAvg * 1.2) {
          patterns.trending.push({ category, trend: 'increasing' });
        } else if (lastAvg < firstAvg * 0.8) {
          patterns.trending.push({ category, trend: 'decreasing' });
        }
      }
    }

    return patterns;
  }
}
