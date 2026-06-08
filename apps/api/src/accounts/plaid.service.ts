import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@financial-hub/data';

@Injectable()
export class PlaidService {
  private plaidClientId: string;
  private plaidSecret: string;
  private plaidEnv: string;
  private plaidApiBase: string;

  constructor(private prisma: PrismaService) {
    this.plaidClientId = process.env.PLAID_CLIENT_ID || '';
    this.plaidSecret = process.env.PLAID_SECRET || '';
    this.plaidEnv = process.env.PLAID_ENV || 'sandbox';

    // Set API base URL based on environment
    const envMap = {
      sandbox: 'https://sandbox.plaid.com',
      development: 'https://development.plaid.com',
      production: 'https://production.plaid.com',
    };
    this.plaidApiBase = envMap[this.plaidEnv] || envMap.sandbox;
  }

  async createLinkToken(userId: string): Promise<{ link_token: string }> {
    if (!this.plaidClientId || !this.plaidSecret) {
      throw new BadRequestException('Plaid credentials not configured');
    }

    try {
      const response = await fetch(`${this.plaidApiBase}/link/token/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.plaidClientId,
          secret: this.plaidSecret,
          client_name: 'Financial Hub',
          user: {
            client_user_id: userId,
          },
          client_exposed_id: userId,
          language: 'en',
          country_codes: ['US', 'GB', 'ES', 'PT', 'FR', 'DE', 'IT', 'IE', 'NL', 'BE'],
          products: ['auth', 'transactions'],
        }),
      });

      if (!response.ok) {
        throw new BadRequestException('Failed to create Plaid link token');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Plaid error:', error);
      throw new BadRequestException('Failed to create Plaid link token');
    }
  }

  async exchangePublicToken(userId: string, publicToken: string) {
    if (!this.plaidClientId || !this.plaidSecret) {
      throw new BadRequestException('Plaid credentials not configured');
    }

    try {
      const response = await fetch(`${this.plaidApiBase}/item/public_token/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.plaidClientId,
          secret: this.plaidSecret,
          public_token: publicToken,
        }),
      });

      if (!response.ok) {
        throw new BadRequestException('Failed to exchange Plaid token');
      }

      const data = await response.json();
      return {
        access_token: data.access_token,
        item_id: data.item_id,
      };
    } catch (error) {
      console.error('Plaid error:', error);
      throw new BadRequestException('Failed to exchange Plaid token');
    }
  }

  async getAccounts(accessToken: string) {
    if (!this.plaidClientId || !this.plaidSecret) {
      throw new BadRequestException('Plaid credentials not configured');
    }

    try {
      const response = await fetch(`${this.plaidApiBase}/accounts/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.plaidClientId,
          secret: this.plaidSecret,
          access_token: accessToken,
        }),
      });

      if (!response.ok) {
        throw new BadRequestException('Failed to fetch Plaid accounts');
      }

      const data = await response.json();
      return data.accounts;
    } catch (error) {
      console.error('Plaid error:', error);
      throw new BadRequestException('Failed to fetch Plaid accounts');
    }
  }

  async getTransactions(accessToken: string, startDate: string, endDate: string) {
    if (!this.plaidClientId || !this.plaidSecret) {
      throw new BadRequestException('Plaid credentials not configured');
    }

    try {
      const response = await fetch(`${this.plaidApiBase}/transactions/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: this.plaidClientId,
          secret: this.plaidSecret,
          access_token: accessToken,
          start_date: startDate,
          end_date: endDate,
          options: {
            include_personal_finance_category: true,
          },
        }),
      });

      if (!response.ok) {
        throw new BadRequestException('Failed to fetch Plaid transactions');
      }

      const data = await response.json();
      return data.transactions;
    } catch (error) {
      console.error('Plaid error:', error);
      throw new BadRequestException('Failed to fetch Plaid transactions');
    }
  }

  async storeAccessToken(userId: string, accountName: string, accessToken: string) {
    const account = await this.prisma.account.create({
      data: {
        userId,
        name: accountName,
        accountNumber: 'plaid-' + Math.random().toString(36).substr(2, 9),
        type: 'bank',
        currency: 'USD',
        institution: 'Connected via Plaid',
        plaidAccessToken: accessToken,
        status: 'active',
        balance: 0,
      },
    });

    return account;
  }
}
