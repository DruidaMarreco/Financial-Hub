import { Account, Transaction } from '../models';

export interface IDataAggregationService {
  // Plaid integration
  createPlaidLinkToken(userId: string): Promise<string>;
  exchangePlaidToken(userId: string, publicToken: string): Promise<string>;

  // Account syncing
  syncAccounts(userId: string): Promise<Account[]>;
  syncTransactions(accountId: string): Promise<Transaction[]>;

  // Manual data import
  importTransactionsFromCSV(accountId: string, csvData: Buffer): Promise<Transaction[]>;

  // Data refresh
  refreshAccountData(accountId: string): Promise<void>;
  refreshAllUserData(userId: string): Promise<void>;
}
