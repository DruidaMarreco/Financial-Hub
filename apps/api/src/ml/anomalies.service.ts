import { Injectable } from '@nestjs/common';
import { PrismaService } from '@financial-hub/data';
import { AnomalyDetector } from './anomaly-detector';

@Injectable()
export class AnomaliesService {
  constructor(private prisma: PrismaService, private detector: AnomalyDetector) {}

  async detectAnomalies(userId: string) {
    const userAccounts = await this.prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });

    const recentTransactions = await this.prisma.transaction.findMany({
      where: {
        accountId: { in: userAccounts.map(a => a.id) },
        date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { date: 'desc' },
      take: 50,
    });

    const historicalTransactions = await this.prisma.transaction.findMany({
      where: {
        accountId: { in: userAccounts.map(a => a.id) },
        date: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      take: 500,
    });

    const anomalies = [];
    for (const tx of recentTransactions) {
      const result = await this.detector.detectAnomaly(
        { ...tx, amount: Math.abs(tx.amount) },
        historicalTransactions,
      );

      if (result.isAnomaly || result.score > 0.7) {
        await this.prisma.transaction.update({
          where: { id: tx.id },
          data: {
            anomalyScore: result.score,
            isAnomaly: result.isAnomaly,
          },
        });

        anomalies.push({
          transaction: tx,
          anomalyScore: result.score,
          isAnomaly: result.isAnomaly,
          reason: result.reason,
        });
      }
    }

    return anomalies;
  }

  async getPatterns(userId: string) {
    const userAccounts = await this.prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });

    const transactions = await this.prisma.transaction.findMany({
      where: {
        accountId: { in: userAccounts.map(a => a.id) },
        date: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
    });

    return this.detector.detectPatterns(transactions);
  }
}
