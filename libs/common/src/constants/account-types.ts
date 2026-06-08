export const ACCOUNT_TYPES = {
  BANK: 'bank',
  CREDIT_CARD: 'credit_card',
  INVESTMENT: 'investment',
  CRYPTO: 'crypto',
  SAVINGS: 'savings',
} as const;

export const ACCOUNT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  CLOSED: 'closed',
} as const;

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense',
  TRANSFER: 'transfer',
  INVESTMENT: 'investment',
} as const;
