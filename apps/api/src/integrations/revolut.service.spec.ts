import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { RevolutService } from './revolut.service';
import { PrismaService } from '@financial-hub/data';

describe('RevolutService', () => {
  let service: RevolutService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        RevolutService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RevolutService>(RevolutService);
    httpService = module.get<HttpService>(HttpService);
  });

  describe('OAuth Flow', () => {
    it('should generate authorization URL', () => {
      const clientId = 'test-client-id';
      const redirectUri = 'http://localhost:3000/callback';
      const state = 'test-state-123';

      const url = service.getAuthorizationUrl(clientId, redirectUri, state);

      expect(url).toContain(clientId);
      expect(url).toContain(redirectUri);
      expect(url).toContain(state);
      expect(url).toContain('https://revolut.com/app/oauth');
    });

    it('should exchange authorization code for tokens', async () => {
      const mockResponse = {
        data: {
          access_token: 'test-access-token',
          refresh_token: 'test-refresh-token',
          expires_in: 3600,
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await service.exchangeCodeForToken(
        'auth-code-123',
        'client-id',
        'client-secret',
        'http://localhost:3000/callback',
      );

      expect(result.access_token).toBe('test-access-token');
      expect(result.refresh_token).toBe('test-refresh-token');
      expect(result.expires_in).toBe(3600);
    });

    it('should handle token exchange error', async () => {
      jest.spyOn(httpService, 'post').mockReturnValue(
        throwError(() => new Error('OAuth error')),
      );

      await expect(
        service.exchangeCodeForToken(
          'invalid-code',
          'client-id',
          'client-secret',
          'http://localhost:3000/callback',
        ),
      ).rejects.toThrow();
    });

    it('should refresh access token', async () => {
      const mockResponse = {
        data: {
          access_token: 'new-access-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
        },
      };

      jest.spyOn(httpService, 'post').mockReturnValue(of(mockResponse));

      const result = await service.refreshAccessToken(
        'old-refresh-token',
        'client-id',
        'client-secret',
      );

      expect(result.access_token).toBe('new-access-token');
    });
  });

  describe('Account Management', () => {
    it('should fetch user accounts', async () => {
      const mockAccounts = {
        data: {
          accounts: [
            {
              id: 'acc-1',
              name: 'Main Account',
              balance: 5000,
              currency: 'EUR',
              type: 'checking',
              iban: 'DE123456789',
            },
            {
              id: 'acc-2',
              name: 'Savings',
              balance: 10000,
              currency: 'EUR',
              type: 'savings',
              iban: 'DE987654321',
            },
          ],
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockAccounts));

      const accounts = await service.getAccounts('test-token', false);

      expect(accounts).toHaveLength(2);
      expect(accounts[0].name).toBe('Main Account');
      expect(accounts[1].balance).toBe(10000);
    });

    it('should handle account fetch error', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(
        throwError(() => new Error('Network error')),
      );

      await expect(service.getAccounts('test-token', false)).rejects.toThrow();
    });
  });

  describe('Transaction Management', () => {
    it('should fetch account transactions', async () => {
      const mockTransactions = {
        data: {
          transactions: [
            {
              id: 'tx-1',
              type: 'card_payment',
              state: 'COMPLETED',
              amount: -50,
              currency: 'EUR',
              merchant: { name: 'Amazon' },
              description: 'Online shopping',
              created_at: '2024-01-15T10:00:00Z',
            },
            {
              id: 'tx-2',
              type: 'transfer',
              state: 'COMPLETED',
              amount: 100,
              currency: 'EUR',
              merchant: { name: 'Salary' },
              description: 'Salary deposit',
              created_at: '2024-01-14T09:00:00Z',
            },
          ],
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockTransactions));

      const transactions = await service.getTransactions(
        'acc-123',
        'test-token',
      );

      expect(transactions).toHaveLength(2);
      expect(transactions[0].amount).toBe(-50);
      expect(transactions[1].merchant.name).toBe('Salary');
    });

    it('should fetch transactions with date range', async () => {
      jest.spyOn(httpService, 'get').mockReturnValue(
        of({ data: { transactions: [] } }),
      );

      await service.getTransactions('acc-123', 'test-token', '2024-01-01', '2024-01-31');

      expect(httpService.get).toHaveBeenCalledWith(
        expect.stringContaining('from=2024-01-01'),
        expect.any(Object),
      );
    });
  });

  describe('Transaction Categorization', () => {
    it('should categorize grocery transactions', () => {
      const transaction = {
        id: 'tx-1',
        type: 'card_payment',
        state: 'COMPLETED',
        amount: -50,
        currency: 'EUR',
        merchant: { name: 'Tesco Supermarket' },
        description: 'Grocery shopping',
        created_at: '2024-01-15T10:00:00Z',
      };

      const category = service.categorizeTransaction(transaction);
      expect(category).toBe('groceries');
    });

    it('should categorize restaurant transactions', () => {
      const transaction = {
        id: 'tx-2',
        type: 'card_payment',
        state: 'COMPLETED',
        amount: -45,
        currency: 'EUR',
        merchant: { name: 'Pizza Hut' },
        description: 'Dinner',
        created_at: '2024-01-15T19:00:00Z',
      };

      const category = service.categorizeTransaction(transaction);
      expect(category).toBe('dining');
    });

    it('should categorize transport transactions', () => {
      const transaction = {
        id: 'tx-3',
        type: 'card_payment',
        state: 'COMPLETED',
        amount: -20,
        currency: 'EUR',
        merchant: { name: 'Uber' },
        description: 'Ride',
        created_at: '2024-01-15T18:00:00Z',
      };

      const category = service.categorizeTransaction(transaction);
      expect(category).toBe('transportation');
    });

    it('should categorize shopping transactions', () => {
      const transaction = {
        id: 'tx-4',
        type: 'card_payment',
        state: 'COMPLETED',
        amount: -100,
        currency: 'EUR',
        merchant: { name: 'Amazon' },
        description: 'Electronics',
        created_at: '2024-01-15T15:00:00Z',
      };

      const category = service.categorizeTransaction(transaction);
      expect(category).toBe('shopping');
    });

    it('should default to other for unknown merchants', () => {
      const transaction = {
        id: 'tx-5',
        type: 'card_payment',
        state: 'COMPLETED',
        amount: -25,
        currency: 'EUR',
        merchant: { name: 'Unknown Merchant' },
        description: 'Unknown transaction',
        created_at: '2024-01-15T12:00:00Z',
      };

      const category = service.categorizeTransaction(transaction);
      expect(category).toBe('other');
    });
  });

  describe('Exchange Rates', () => {
    it('should fetch exchange rates', async () => {
      const mockRates = {
        data: {
          rates: {
            USD: 1.1,
            GBP: 0.87,
            JPY: 132.5,
          },
        },
      };

      jest.spyOn(httpService, 'get').mockReturnValue(of(mockRates));

      const rates = await service.getExchangeRates('test-token', false);

      expect(rates.rates.USD).toBe(1.1);
      expect(rates.rates.GBP).toBe(0.87);
    });
  });

  describe('Sandbox Mode', () => {
    it('should use sandbox URL in development', async () => {
      const getSpy = jest.spyOn(httpService, 'get').mockReturnValue(
        of({ data: { accounts: [] } }),
      );

      await service.getAccounts('test-token', true);

      expect(getSpy).toHaveBeenCalledWith(
        expect.stringContaining('sandbox-api.revolut.com'),
        expect.any(Object),
      );
    });

    it('should use production URL otherwise', async () => {
      const getSpy = jest.spyOn(httpService, 'get').mockReturnValue(
        of({ data: { accounts: [] } }),
      );

      await service.getAccounts('test-token', false);

      expect(getSpy).toHaveBeenCalledWith(
        expect.stringContaining('api.revolut.com'),
        expect.not.stringContaining('sandbox'),
      );
    });
  });
});
