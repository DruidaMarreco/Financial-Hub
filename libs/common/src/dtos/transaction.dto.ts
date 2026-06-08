export interface CreateTransactionDto {
  accountId: string;
  amount: number;
  currency: string;
  type: string;
  description: string;
  category?: string;
  merchant?: string;
  date: Date;
  tags?: string[];
  notes?: string;
}

export interface UpdateTransactionDto {
  amount?: number;
  description?: string;
  category?: string;
  merchant?: string;
  tags?: string[];
  notes?: string;
}

export interface TransactionResponseDto {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  type: string;
  description: string;
  category?: string;
  merchant?: string;
  date: Date;
  tags?: string[];
  createdAt: Date;
}

export interface TransactionFilterDto {
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  category?: string;
  type?: string;
  minAmount?: number;
  maxAmount?: number;
}
