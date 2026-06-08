import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@financial-hub/data';
import { PlaidService } from '../accounts/plaid.service';
import { TransactionCategorizer } from '../ml/transaction-categorizer';

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private plaidService: PlaidService,
    private categorizer: TransactionCategorizer,
  ) {}

  async syncTransactionsFromPlaid(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (!account.plaidAccessToken) {
      throw new BadRequestException('Account not linked to Plaid');
    }

    try {
      // Get last sync date or start from 90 days ago
      const lastSync = account.lastSync || new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const startDate = lastSync.toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      // Fetch transactions from Plaid
      const plaidTransactions = await this.plaidService.getTransactions(
        account.plaidAccessToken,
        startDate,
        endDate,
      );

      // Store in database
      const storedTransactions = [];
      for (const tx of plaidTransactions) {
        const existingTx = await this.prisma.transaction.findFirst({
          where: {
            accountId,
            description: tx.name,
            amount: tx.amount,
            date: new Date(tx.date),
          },
        });

        if (!existingTx) {
          const transaction = await this.prisma.transaction.create({
            data: {
              accountId,
              description: tx.name,
              merchant: tx.merchant_name || tx.name,
              amount: tx.amount,
              currency: tx.iso_currency_code || 'USD',
              type: tx.amount < 0 ? 'expense' : 'income',
              category: tx.personal_finance_category?.primary || 'uncategorized',
              date: new Date(tx.date),
            },
          });

          // Auto-categorize with ML model
          const categorization = await this.categorizer.predict(transaction);
          await this.prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              category: categorization.category,
              categoryConfidence: categorization.confidence,
            },
          });

          storedTransactions.push(transaction);
        }
      }

      // Update account sync time
      await this.prisma.account.update({
        where: { id: accountId },
        data: { lastSync: new Date() },
      });

      return {
        success: true,
        synced: storedTransactions.length,
        transactions: storedTransactions,
      };
    } catch (error) {
      console.error('Transaction sync error:', error);
      throw new BadRequestException('Failed to sync transactions');
    }
  }

  async getTransactions(userId: string, filters?: {
    accountId?: string;
    startDate?: Date;
    endDate?: Date;
    category?: string;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
  }) {
    const where: any = {};

    // Verify user owns the accounts
    const userAccounts = await this.prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });
    const accountIds = userAccounts.map(a => a.id);

    if (filters?.accountId) {
      if (!accountIds.includes(filters.accountId)) {
        throw new BadRequestException('Account not found');
      }
      where.accountId = filters.accountId;
    } else {
      where.accountId = { in: accountIds };
    }

    if (filters?.startDate) where.date = { gte: filters.startDate };
    if (filters?.endDate) where.date = { ...where.date, lte: filters.endDate };
    if (filters?.category) where.category = filters.category;
    if (filters?.minAmount) where.amount = { gte: filters.minAmount };
    if (filters?.maxAmount) where.amount = { ...where.amount, lte: filters.maxAmount };
    if (filters?.search) {
      where.OR = [
        { description: { contains: filters.search, mode: 'insensitive' } },
        { merchant: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      take: 1000,
    });

    return transactions;
  }

  async getTransaction(transactionId: string, userId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id: transactionId },
      include: { account: true },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    // Verify user owns the account
    const account = await this.prisma.account.findFirst({
      where: { id: transaction.accountId, userId },
    });

    if (!account) {
      throw new BadRequestException('Unauthorized');
    }

    return transaction;
  }

  async categorizeTransaction(transactionId: string, userId: string, category: string) {
    const transaction = await this.getTransaction(transactionId, userId);

    const updated = await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { category },
    });

    // Log for model retraining
    await this.categorizer.logCorrection(transaction, category);

    return updated;
  }

  async bulkCategorizeUncategorized(userId: string) {
    const userAccounts = await this.prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });

    const transactions = await this.prisma.transaction.findMany({
      where: {
        accountId: { in: userAccounts.map(a => a.id) },
        OR: [
          { category: 'uncategorized' },
          { categoryConfidence: { lt: 0.5 } },
        ],
      },
      take: 100,
    });

    const categorized = [];
    for (const transaction of transactions) {
      const categorization = await this.categorizer.predict(transaction);
      const updated = await this.prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          category: categorization.category,
          categoryConfidence: categorization.confidence,
        },
      });
      categorized.push(updated);
    }

    return {
      success: true,
      categorized: categorized.length,
      transactions: categorized,
    };
  }

  async getTransactionStats(userId: string, period: 'month' | 'year' = 'month') {
    const userAccounts = await this.prisma.account.findMany({
      where: { userId },
      select: { id: true },
    });

    const transactions = await this.prisma.transaction.findMany({
      where: {
        accountId: { in: userAccounts.map(a => a.id) },
      },
    });

    const stats = {
      totalTransactions: transactions.length,
      totalIncome: 0,
      totalExpenses: 0,
      byCategory: {} as Record<string, number>,
      byMerchant: {} as Record<string, number>,
    };

    for (const tx of transactions) {
      if (tx.type === 'income') {
        stats.totalIncome += tx.amount;
      } else {
        stats.totalExpenses += Math.abs(tx.amount);
      }

      stats.byCategory[tx.category] = (stats.byCategory[tx.category] || 0) + Math.abs(tx.amount);
      stats.byMerchant[tx.merchant || 'unknown'] = (stats.byMerchant[tx.merchant || 'unknown'] || 0) + 1;
    }

    return stats;
  }
}
