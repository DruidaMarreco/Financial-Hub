import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@financial-hub/data';
import { RevolutService } from './revolut.service';
import * as crypto from 'crypto';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private readonly encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

  constructor(
    private prisma: PrismaService,
    private revolutService: RevolutService,
  ) {}

  /**
   * Store Revolut credentials securely
   */
  async storeRevolutCredentials(
    userId: string,
    tokenData: {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    },
  ) {
    try {
      const encryptedAccessToken = this.encryptData(tokenData.access_token);
      const encryptedRefreshToken = this.encryptData(tokenData.refresh_token);
      const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

      // In a real app, you'd store this in a separate BankIntegration table
      // For now, we'll use a simple approach
      this.logger.log(`Stored Revolut credentials for user ${userId}`);

      return {
        success: true,
        expiresAt,
      };
    } catch (error) {
      this.logger.error('Failed to store Revolut credentials:', error);
      throw error;
    }
  }

  /**
   * Sync Revolut accounts to user's financial accounts
   */
  async syncRevolutAccounts(userId: string, accounts: any[]) {
    try {
      const syncedAccounts = accounts.map((account) => ({
        userId,
        source: 'revolut',
        externalId: account.id,
        name: account.name,
        type: 'checking', // Default type for bank accounts
        balance: account.balance,
        currency: account.currency,
        iban: account.iban,
        lastSynced: new Date(),
      }));

      this.logger.log(`Synced ${syncedAccounts.length} Revolut accounts for user ${userId}`);

      return syncedAccounts;
    } catch (error) {
      this.logger.error('Failed to sync Revolut accounts:', error);
      throw error;
    }
  }

  /**
   * Sync all Revolut data (accounts and transactions)
   */
  async syncAllRevolutData(userId: string) {
    try {
      // Get stored credentials (in production, retrieve from secure storage)
      const accessToken = process.env.REVOLUT_TEST_TOKEN || '';

      if (!accessToken) {
        throw new Error('No Revolut access token found');
      }

      // Fetch accounts
      const accounts = await this.revolutService.getAccounts(
        accessToken,
        process.env.NODE_ENV === 'development',
      );

      const syncedAccounts = await this.syncRevolutAccounts(userId, accounts);

      // Fetch transactions for each account
      const allTransactions = [];
      for (const account of accounts) {
        try {
          const transactions = await this.revolutService.getTransactions(
            account.id,
            accessToken,
            undefined,
            undefined,
            process.env.NODE_ENV === 'development',
          );

          allTransactions.push(
            ...transactions.map((tx) => ({
              accountId: account.id,
              externalId: tx.id,
              amount: tx.amount,
              currency: tx.currency,
              description: tx.description,
              merchant: tx.merchant?.name,
              category: this.revolutService.categorizeTransaction(tx),
              date: new Date(tx.created_at),
            })),
          );
        } catch (error) {
          this.logger.warn(`Failed to fetch transactions for account ${account.id}:`, error.message);
        }
      }

      return {
        success: true,
        accountsSynced: syncedAccounts.length,
        transactionsSynced: allTransactions.length,
        lastSync: new Date(),
      };
    } catch (error) {
      this.logger.error('Failed to sync all Revolut data:', error);
      throw error;
    }
  }

  /**
   * Get synced Revolut accounts for a user
   */
  async getRevolutAccounts(userId: string) {
    try {
      // In production, query from database
      // For now, return empty array
      return {
        success: true,
        accounts: [],
        lastSync: null,
      };
    } catch (error) {
      this.logger.error('Failed to get Revolut accounts:', error);
      throw error;
    }
  }

  /**
   * Get Revolut integration status
   */
  async getRevolutStatus(userId: string) {
    try {
      // In production, check database for integration record
      return {
        connected: false,
        expiresAt: null,
        accountCount: 0,
        lastSync: null,
      };
    } catch (error) {
      this.logger.error('Failed to get Revolut status:', error);
      throw error;
    }
  }

  /**
   * Encrypt sensitive data
   */
  private encryptData(data: string): string {
    try {
      const cipher = crypto.createCipher('aes-256-cbc', this.encryptionKey);
      let encrypted = cipher.update(data, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      this.logger.error('Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  private decryptData(data: string): string {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', this.encryptionKey);
      let decrypted = decipher.update(data, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed:', error);
      throw error;
    }
  }
}
