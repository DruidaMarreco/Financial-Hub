import { Injectable } from '@nestjs/common';

interface Transaction {
  id?: string;
  amount: number;
  category: string;
  date: Date;
  merchant?: string;
}

interface IsolationResult {
  anomalyScore: number; // 0-1, higher = more anomalous
  isAnomaly: boolean;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

@Injectable()
export class IsolationForest {
  /**
   * Isolation Forest: Detect anomalies by isolating outliers
   * (Simplified version - ready for scikit-learn upgrade)
   */
  async detectAnomalyAdvanced(transaction: Transaction, historicalTransactions: Transaction[]): Promise<IsolationResult> {
    const categoryTxs = historicalTransactions.filter(t => t.category === transaction.category);

    if (categoryTxs.length < 10) {
      return {
        anomalyScore: 0.3,
        isAnomaly: false,
        reason: 'insufficient_history',
        severity: 'low',
      };
    }

    // Feature extraction
    const features = this.extractFeatures(transaction, categoryTxs);
    const anomalyScore = this.isolationScore(features, categoryTxs);

    // Determine severity
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (anomalyScore > 0.8) severity = 'high';
    else if (anomalyScore > 0.6) severity = 'medium';

    const isAnomaly = anomalyScore > 0.7;
    const reason = this.getReason(features, anomalyScore);

    return {
      anomalyScore,
      isAnomaly,
      reason,
      severity,
    };
  }

  private extractFeatures(tx: Transaction, historical: Transaction[]): Record<string, number> {
    const amounts = historical.map(t => Math.abs(t.amount));
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const stdAmount = Math.sqrt(amounts.reduce((sq, n) => sq + Math.pow(n - avgAmount, 2), 0) / amounts.length);

    // Hour of day feature
    const txHour = new Date(tx.date).getHours();
    const historicalHours = historical.map(t => new Date(t.date).getHours());
    const unusualHour = historicalHours.filter(h => h === txHour).length < historicalHours.length * 0.1 ? 1 : 0;

    // Merchant frequency
    const merchantCount = historical.filter(t => t.merchant === tx.merchant).length;
    const merchantRarity = 1 - merchantCount / historical.length;

    return {
      amountDeviation: Math.abs(Math.abs(tx.amount) - avgAmount) / (stdAmount || 1),
      unusualHour,
      merchantRarity,
      dayOfWeekUnusual: this.isDayUnusual(tx, historical) ? 1 : 0,
    };
  }

  private isDayUnusual(tx: Transaction, historical: Transaction[]): boolean {
    const dayOfWeek = new Date(tx.date).getDay();
    const historicalDays = historical.map(t => new Date(t.date).getDay());
    const frequency = historicalDays.filter(d => d === dayOfWeek).length;
    return frequency < historicalDays.length * 0.1;
  }

  private isolationScore(features: Record<string, number>, historical: Transaction[]): number {
    // Weighted anomaly score based on features
    let score = 0;
    const weights = {
      amountDeviation: 0.4,
      unusualHour: 0.2,
      merchantRarity: 0.2,
      dayOfWeekUnusual: 0.2,
    };

    for (const [feature, weight] of Object.entries(weights)) {
      const value = features[feature] || 0;
      score += Math.min(value, 1) * weight;
    }

    return Math.min(1, score);
  }

  private getReason(features: Record<string, number>, score: number): string {
    const reasons: string[] = [];

    if (features.amountDeviation > 2) reasons.push('unusual_amount');
    if (features.unusualHour > 0.5) reasons.push('unusual_time');
    if (features.merchantRarity > 0.7) reasons.push('new_merchant');
    if (features.dayOfWeekUnusual > 0.5) reasons.push('unusual_day');

    if (reasons.length === 0 && score > 0.7) return 'multivariate_anomaly';
    return reasons.join('_');
  }

  /**
   * Cluster similar transactions for insights
   */
  clusterTransactions(transactions: Transaction[]): Map<string, Transaction[]> {
    const clusters = new Map<string, Transaction[]>();

    for (const tx of transactions) {
      const key = this.getClusterKey(tx);

      if (!clusters.has(key)) {
        clusters.set(key, []);
      }

      clusters.get(key)!.push(tx);
    }

    return clusters;
  }

  private getClusterKey(tx: Transaction): string {
    // Cluster by: category + merchant + amount range
    const amountBucket = Math.floor(Math.abs(tx.amount) / 10) * 10;
    const merchant = tx.merchant || 'unknown';
    return `${tx.category}::${merchant}::${amountBucket}`;
  }

  /**
   * Find transaction groups with common characteristics
   */
  findTransactionGroups(transactions: Transaction[]): Array<{
    name: string;
    count: number;
    totalAmount: number;
    avgAmount: number;
    frequency: string; // weekly, monthly, etc.
  }> {
    const clusters = this.clusterTransactions(transactions);
    const groups: Array<{
      name: string;
      count: number;
      totalAmount: number;
      avgAmount: number;
      frequency: string;
    }> = [];

    for (const [key, txs] of clusters) {
      if (txs.length < 2) continue;

      const totalAmount = txs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
      const avgAmount = totalAmount / txs.length;

      const frequency = this.detectFrequency(txs);

      groups.push({
        name: key.split('::')[1] || 'unknown',
        count: txs.length,
        totalAmount,
        avgAmount,
        frequency,
      });
    }

    return groups.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  private detectFrequency(transactions: Transaction[]): string {
    if (transactions.length < 2) return 'once';

    const dates = transactions.map(t => new Date(t.date).getTime()).sort();
    const diffs = [];

    for (let i = 1; i < dates.length; i++) {
      diffs.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24)); // days
    }

    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;

    if (avgDiff < 2) return 'almost_daily';
    if (avgDiff < 7) return 'weekly';
    if (avgDiff < 30) return 'every_few_weeks';
    if (avgDiff < 60) return 'monthly';
    return 'occasional';
  }
}
