export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
  INVESTMENT = 'investment',
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  type: TransactionType;
  description: string;
  category?: string;
  date: Date;
  merchant?: string;
  tags?: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionCategory {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  order: number;
}
