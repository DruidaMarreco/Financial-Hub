import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '@financial-hub/data';

interface RevolutAccount {
  id: string;
  name: string;
  balance: number;
  currency: string;
  type: string;
  iban?: string;
}

interface RevolutTransaction {
  id: string;
  type: string;
  state: string;
  amount: number;
  currency: string;
  merchant?: {
    name: string;
    city?: string;
  };
  description: string;
  created_at: string;
  updated_at: string;
  legs?: Array<{
    amount: number;
    currency: string;
  }>;
}

@Injectable()
export class RevolutService {
  private readonly logger = new Logger(RevolutService.name);
  private readonly baseUrl = 'https://api.revolut.com/1.0';
  private readonly sandboxUrl = 'https://sandbox-api.revolut.com/1.0';

  constructor(
    private httpService: HttpService,
    private prisma: PrismaService,
  ) {}

  /**
   * Get the OAuth authorization URL for user login
   */
  getAuthorizationUrl(clientId: string, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state: state,
    });
    return `https://revolut.com/app/oauth?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<{ access_token: string; refresh_token: string; expires_in: number }>(
          `${this.baseUrl}/auth/token`,
          {
            grant_type: 'authorization_code',
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to exchange code for token:', error.response?.data);
      throw new BadRequestException('Failed to authenticate with Revolut');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<{ access_token: string; refresh_token: string; expires_in: number }>(
          `${this.baseUrl}/auth/token`,
          {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret,
          },
        ),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to refresh access token:', error.response?.data);
      throw new BadRequestException('Failed to refresh token');
    }
  }

  /**
   * Get all accounts for the authenticated user
   */
  async getAccounts(accessToken: string, useSandbox = false): Promise<RevolutAccount[]> {
    try {
      const baseUrl = useSandbox ? this.sandboxUrl : this.baseUrl;
      const response = await firstValueFrom(
        this.httpService.get<{ accounts?: RevolutAccount[] } | RevolutAccount[]>(
          `${baseUrl}/accounts`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      return (response.data as any).accounts || response.data;
    } catch (error) {
      this.logger.error('Failed to fetch accounts:', error.response?.data);
      throw new BadRequestException('Failed to fetch Revolut accounts');
    }
  }

  /**
   * Get transactions for a specific account
   */
  async getTransactions(
    accountId: string,
    accessToken: string,
    from?: string,
    to?: string,
    useSandbox = false,
  ): Promise<RevolutTransaction[]> {
    try {
      const baseUrl = useSandbox ? this.sandboxUrl : this.baseUrl;
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const url = `${baseUrl}/accounts/${accountId}/transactions${params.toString() ? '?' + params.toString() : ''}`;

      const response = await firstValueFrom(
        this.httpService.get<{ transactions?: RevolutTransaction[] } | RevolutTransaction[]>(
          url,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        ),
      );

      return (response.data as any).transactions || response.data;
    } catch (error) {
      this.logger.error('Failed to fetch transactions:', error.response?.data);
      throw new BadRequestException('Failed to fetch Revolut transactions');
    }
  }

  /**
   * Get exchange rates from Revolut
   */
  async getExchangeRates(accessToken: string, useSandbox = false): Promise<{ rates: Record<string, number> }> {
    try {
      const baseUrl = useSandbox ? this.sandboxUrl : this.baseUrl;
      const response = await firstValueFrom(
        this.httpService.get<{ rates: Record<string, number> }>(`${baseUrl}/rates`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }),
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch exchange rates:', error.response?.data);
      throw new BadRequestException('Failed to fetch exchange rates');
    }
  }

  /**
   * Categorize a transaction
   */
  categorizeTransaction(transaction: RevolutTransaction): string {
    const description = (transaction.description || '').toLowerCase();
    const merchant = (transaction.merchant?.name || '').toLowerCase();
    const fullText = `${description} ${merchant}`;

    // Simple categorization based on keywords
    if (fullText.includes('grocery') || fullText.includes('supermarket') || fullText.includes('tesco') || fullText.includes('sainsbury')) {
      return 'groceries';
    }
    if (fullText.includes('restaurant') || fullText.includes('cafe') || fullText.includes('dining') || fullText.includes('pizza') || fullText.includes('mcdonald')) {
      return 'dining';
    }
    if (fullText.includes('uber') || fullText.includes('taxi') || fullText.includes('transport') || fullText.includes('train') || fullText.includes('bus')) {
      return 'transportation';
    }
    if (fullText.includes('amazon') || fullText.includes('shop') || fullText.includes('store') || fullText.includes('mall')) {
      return 'shopping';
    }
    if (fullText.includes('utility') || fullText.includes('electric') || fullText.includes('water') || fullText.includes('internet')) {
      return 'utilities';
    }
    if (fullText.includes('entertainment') || fullText.includes('cinema') || fullText.includes('movie') || fullText.includes('spotify') || fullText.includes('netflix')) {
      return 'entertainment';
    }

    return 'other';
  }
}
