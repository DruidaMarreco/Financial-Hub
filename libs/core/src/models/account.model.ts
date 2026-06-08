export enum AccountType {
  BANK = 'bank',
  CREDIT_CARD = 'credit_card',
  INVESTMENT = 'investment',
  CRYPTO = 'crypto',
  SAVINGS = 'savings',
}

export enum AccountStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CLOSED = 'closed',
}

export interface Account {
  id: string;
  userId: string;
  name: string;
  accountNumber: string;
  type: AccountType;
  status: AccountStatus;
  balance: number;
  currency: string;
  institution: string;
  lastSync: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaidAccount extends Account {
  plaidAccountId: string;
  plaidAccessToken: string;
}
