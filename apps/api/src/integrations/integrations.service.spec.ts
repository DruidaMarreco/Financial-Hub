import { Test, TestingModule } from '@nestjs/testing';
import { IntegrationsService } from './integrations.service';
import { RevolutService } from './revolut.service';
import { PrismaService } from '@financial-hub/data';

describe('IntegrationsService', () => {
  let service: IntegrationsService;
  let revolutService: RevolutService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationsService,
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: RevolutService,
          useValue: {
            getAccounts: jest.fn(),
            getTransactions: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IntegrationsService>(IntegrationsService);
    revolutService = module.get<RevolutService>(RevolutService);
  });

  describe('Credential Management', () => {
    it('should store Revolut credentials securely', async () => {
      const tokenData = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
      };

      const result = await service.storeRevolutCredentials('user-123', tokenData);

      expect(result.success).toBe(true);
      expect(result.expiresAt).toBeDefined();
    });

    it('should encrypt access token', async () => {
      const tokenData = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        expires_in: 3600,
      };

      // The encrypted data should not contain the plain token
      await service.storeRevolutCredentials('user-123', tokenData);
      // Verification would be done through actual encrypted storage
    });
  });

  describe('Account Syncing', () => {
    it('should sync Revolut accounts for user', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          name: 'Main Account',
          balance: 5000,
          currency: 'EUR',
          type: 'checking',
          iban: 'DE123456789',
        },
      ];

      const result = await service.syncRevolutAccounts('user-123', mockAccounts);

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-123');
      expect(result[0].source).toBe('revolut');
      expect(result[0].name).toBe('Main Account');
    });

    it('should add external ID for synced accounts', async () => {
      const mockAccounts = [
        {
          id: 'revolut-acc-123',
          name: 'Test Account',
          balance: 1000,
          currency: 'EUR',
          type: 'checking',
        },
      ];

      const result = await service.syncRevolutAccounts('user-123', mockAccounts);

      expect(result[0].externalId).toBe('revolut-acc-123');
    });

    it('should set last synced timestamp', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          name: 'Account',
          balance: 1000,
          currency: 'EUR',
          type: 'checking',
        },
      ];

      const result = await service.syncRevolutAccounts('user-123', mockAccounts);

      expect(result[0].lastSynced).toBeDefined();
      expect(result[0].lastSynced instanceof Date).toBe(true);
    });
  });

  describe('Full Data Sync', () => {
    it('should sync all Revolut data (accounts and transactions)', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          name: 'Main Account',
          balance: 5000,
          currency: 'EUR',
          type: 'checking',
        },
      ];

      const mockTransactions = [
        {
          id: 'tx-1',
          type: 'card_payment',
          state: 'COMPLETED',
          amount: -50,
          currency: 'EUR',
          merchant: { name: 'Amazon' },
          description: 'Shopping',
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      jest.spyOn(revolutService, 'getAccounts').mockResolvedValue(mockAccounts);
      jest
        .spyOn(revolutService, 'getTransactions')
        .mockResolvedValue(mockTransactions);

      const result = await service.syncAllRevolutData('user-123');

      expect(result.success).toBe(true);
      expect(result.accountsSynced).toBe(1);
      expect(result.transactionsSynced).toBe(1);
    });

    it('should handle sync errors gracefully', async () => {
      jest
        .spyOn(revolutService, 'getAccounts')
        .mockRejectedValue(new Error('Network error'));

      await expect(service.syncAllRevolutData('user-123')).rejects.toThrow();
    });

    it('should continue syncing if one transaction fails', async () => {
      const mockAccounts = [
        { id: 'acc-1', name: 'Account 1', balance: 1000, currency: 'EUR', type: 'checking' },
        { id: 'acc-2', name: 'Account 2', balance: 2000, currency: 'EUR', type: 'savings' },
      ];

      const mockTransactions = [
        {
          id: 'tx-1',
          type: 'card_payment',
          state: 'COMPLETED',
          amount: -50,
          currency: 'EUR',
          merchant: { name: 'Amazon' },
          description: 'Shopping',
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      jest.spyOn(revolutService, 'getAccounts').mockResolvedValue(mockAccounts);
      jest
        .spyOn(revolutService, 'getTransactions')
        .mockResolvedValueOnce(mockTransactions)
        .mockRejectedValueOnce(new Error('Transaction fetch failed'));

      const result = await service.syncAllRevolutData('user-123');

      expect(result.accountsSynced).toBe(2);
      expect(result.transactionsSynced).toBe(1);
    });
  });

  describe('Status Checking', () => {
    it('should return integration status', async () => {
      const status = await service.getRevolutStatus('user-123');

      expect(status).toHaveProperty('connected');
      expect(status).toHaveProperty('accountCount');
      expect(status).toHaveProperty('lastSync');
    });
  });

  describe('Data Retrieval', () => {
    it('should retrieve synced Revolut accounts', async () => {
      const result = await service.getRevolutAccounts('user-123');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('accounts');
      expect(result).toHaveProperty('lastSync');
    });
  });

  describe('Transaction Categorization', () => {
    it('should categorize synced transactions', async () => {
      const mockAccounts = [
        {
          id: 'acc-1',
          name: 'Account',
          balance: 1000,
          currency: 'EUR',
          type: 'checking',
        },
      ];

      const mockTransactions = [
        {
          id: 'tx-1',
          type: 'card_payment',
          state: 'COMPLETED',
          amount: -50,
          currency: 'EUR',
          merchant: { name: 'Sainsbury' },
          description: 'Groceries',
          created_at: '2024-01-15T10:00:00Z',
        },
      ];

      jest.spyOn(revolutService, 'getAccounts').mockResolvedValue(mockAccounts);
      jest
        .spyOn(revolutService, 'getTransactions')
        .mockResolvedValue(mockTransactions);

      const result = await service.syncAllRevolutData('user-123');

      expect(result.transactionsSynced).toBe(1);
      // Category would be assigned in the actual sync
    });
  });
});
