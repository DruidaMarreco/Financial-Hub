import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@financial-hub/data';
import * as crypto from 'crypto';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

  constructor(private prisma: PrismaService) {}

  /**
   * Encrypt sensitive data (bank tokens)
   */
  encrypt(data: string): string {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey.padEnd(32)), iv);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      this.logger.error('Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    try {
      const [ivHex, encrypted] = encryptedData.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey.padEnd(32)), iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed:', error);
      throw error;
    }
  }

  /**
   * Create or update user account in database
   */
  async upsertAccount(userId: string, accountData: any) {
    try {
      return await this.prisma.account.upsert({
        where: {
          userId_accountNumber: {
            userId,
            accountNumber: accountData.id || accountData.accountNumber,
          },
        },
        update: {
          name: accountData.name,
          balance: accountData.balance,
          currency: accountData.currency,
          monthlySpend: accountData.monthlySpend || 0,
          lastSync: new Date(),
        },
        create: {
          userId,
          accountNumber: accountData.id || accountData.accountNumber,
          name: accountData.name,
          type: accountData.type || 'checking',
          institution: accountData.institution || 'manual',
          balance: accountData.balance,
          currency: accountData.currency || 'EUR',
          monthlySpend: accountData.monthlySpend || 0,
          status: 'active',
        },
      });
    } catch (error) {
      this.logger.error('Failed to upsert account:', error);
      throw error;
    }
  }

  /**
   * Store bank integration with encrypted token
   */
  async storeBankIntegration(userId: string, provider: string, tokens: any) {
    try {
      return await this.prisma.bankIntegration.upsert({
        where: {
          userId_provider: {
            userId,
            provider,
          },
        },
        update: {
          encryptedToken: this.encrypt(tokens.access_token),
          refreshToken: tokens.refresh_token ? this.encrypt(tokens.refresh_token) : null,
          expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          lastSyncedAt: new Date(),
          syncStatus: 'pending',
        },
        create: {
          userId,
          provider,
          encryptedToken: this.encrypt(tokens.access_token),
          refreshToken: tokens.refresh_token ? this.encrypt(tokens.refresh_token) : null,
          expiresAt: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
          syncStatus: 'pending',
        },
      });
    } catch (error) {
      this.logger.error('Failed to store bank integration:', error);
      throw error;
    }
  }

  /**
   * Get decrypted bank token
   */
  async getBankIntegration(userId: string, provider: string) {
    try {
      const integration = await this.prisma.bankIntegration.findUnique({
        where: {
          userId_provider: {
            userId,
            provider,
          },
        },
      });

      if (!integration) return null;

      return {
        ...integration,
        encryptedToken: this.decrypt(integration.encryptedToken),
        refreshToken: integration.refreshToken ? this.decrypt(integration.refreshToken) : null,
      };
    } catch (error) {
      this.logger.error('Failed to get bank integration:', error);
      throw error;
    }
  }

  /**
   * Store transactions with batch insert
   */
  async storeTransactions(accountId: string, transactions: any[]) {
    try {
      const results = await Promise.all(
        transactions.map((tx) =>
          this.prisma.transaction.upsert({
            where: {
              id: tx.id || `${accountId}-${tx.externalId || Math.random()}`,
            },
            update: {
              amount: tx.amount,
              category: tx.category || 'other',
              merchant: tx.merchant,
            },
            create: {
              accountId,
              amount: tx.amount,
              currency: tx.currency || 'EUR',
              type: tx.amount < 0 ? 'expense' : 'income',
              category: tx.category || 'other',
              merchant: tx.merchant,
              description: tx.description,
              date: new Date(tx.date),
            },
          }),
        ),
      );

      return results;
    } catch (error) {
      this.logger.error('Failed to store transactions:', error);
      throw error;
    }
  }

  /**
   * Record balance history
   */
  async recordBalanceHistory(accountId: string, balance: number, currency: string) {
    try {
      return await this.prisma.balanceHistory.create({
        data: {
          accountId,
          balance,
          currency,
        },
      });
    } catch (error) {
      this.logger.error('Failed to record balance history:', error);
      throw error;
    }
  }

  /**
   * Log sync event
   */
  async logSync(userId: string, provider: string, status: string, data: any) {
    try {
      return await this.prisma.syncLog.create({
        data: {
          userId,
          provider,
          status,
          accountsSynced: data.accountsSynced || 0,
          transactionsSynced: data.transactionsSynced || 0,
          errorMessage: data.errorMessage,
          duration: data.duration,
        },
      });
    } catch (error) {
      this.logger.error('Failed to log sync:', error);
      throw error;
    }
  }

  /**
   * Get user's accounts with balance history
   */
  async getUserAccounts(userId: string) {
    try {
      return await this.prisma.account.findMany({
        where: { userId },
        include: {
          transactions: true,
          balanceHistory: {
            orderBy: { recordedAt: 'desc' },
            take: 10,
          },
        },
      });
    } catch (error) {
      this.logger.error('Failed to get user accounts:', error);
      throw error;
    }
  }

  /**
   * Get transaction analytics
   */
  async getTransactionAnalytics(userId: string, startDate: Date, endDate: Date) {
    try {
      const transactions = await this.prisma.transaction.findMany({
        where: {
          account: {
            userId,
          },
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Group by category
      const byCategory = transactions.reduce(
        (acc, tx) => {
          acc[tx.category] = (acc[tx.category] || 0) + Math.abs(tx.amount);
          return acc;
        },
        {} as Record<string, number>,
      );

      return {
        totalTransactions: transactions.length,
        totalSpending: transactions.filter((tx) => tx.amount < 0).reduce((sum, tx) => sum + Math.abs(tx.amount), 0),
        totalIncome: transactions.filter((tx) => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0),
        byCategory,
      };
    } catch (error) {
      this.logger.error('Failed to get transaction analytics:', error);
      throw error;
    }
  }
}
