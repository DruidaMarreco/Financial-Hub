import { Injectable } from '@nestjs/common';

interface Transaction {
  amount: number;
  category: string;
  date: Date;
}

interface Forecast {
  category: string;
  month: string;
  predicted: number;
  confidenceLower: number;
  confidenceUpper: number;
}

@Injectable()
export class Forecaster {
  async forecastSpending(transactions: Transaction[], monthsAhead: number = 1): Promise<Forecast[]> {
    const byCategory = new Map<string, number[]>();

    // Group by month and category
    const monthlyByCategory = new Map<string, Map<string, number>>();

    for (const tx of transactions) {
      const date = new Date(tx.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyByCategory.has(monthKey)) {
        monthlyByCategory.set(monthKey, new Map());
      }

      const monthData = monthlyByCategory.get(monthKey)!;
      monthData.set(
        tx.category,
        (monthData.get(tx.category) || 0) + Math.abs(tx.amount),
      );
    }

    // Build time series per category
    const months = Array.from(monthlyByCategory.keys()).sort();
    for (const [, monthData] of monthlyByCategory) {
      for (const [category] of monthData) {
        if (!byCategory.has(category)) {
          byCategory.set(category, []);
        }
      }
    }

    for (const [category] of byCategory) {
      const series: number[] = [];
      for (const month of months) {
        const monthData = monthlyByCategory.get(month)!;
        series.push(monthData.get(category) || 0);
      }
      byCategory.set(category, series);
    }

    // Simple exponential smoothing + trend
    const forecasts: Forecast[] = [];
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + monthsAhead);
    const futureMonth = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;

    for (const [category, series] of byCategory) {
      if (series.length < 3) continue;

      const alpha = 0.3;
      let smoothed = series[0];
      let trend = series[1] - series[0];

      for (let i = 1; i < series.length; i++) {
        const prevSmoothed = smoothed;
        smoothed = alpha * series[i] + (1 - alpha) * (smoothed + trend);
        trend = 0.1 * (smoothed - prevSmoothed) + 0.9 * trend;
      }

      const predicted = smoothed + trend * monthsAhead;
      const stdDev = Math.sqrt(
        series.reduce((sum, val) => sum + Math.pow(val - smoothed, 2), 0) / series.length,
      );

      forecasts.push({
        category,
        month: futureMonth,
        predicted: Math.max(0, predicted),
        confidenceLower: Math.max(0, predicted - 1.96 * stdDev),
        confidenceUpper: predicted + 1.96 * stdDev,
      });
    }

    return forecasts;
  }

  calculateRunway(monthlyExpenses: number, availableFunds: number): { months: number; date: string } {
    const months = availableFunds / (monthlyExpenses || 1);
    const runoutDate = new Date();
    runoutDate.setMonth(runoutDate.getMonth() + months);

    return {
      months: Math.floor(months),
      date: runoutDate.toISOString().split('T')[0],
    };
  }

  calculateFINumber(annualExpenses: number, withdrawalRate: number = 0.04): number {
    return Math.round(annualExpenses / withdrawalRate);
  }
}
