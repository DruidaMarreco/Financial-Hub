import axios from 'axios';
import { getAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  type: 'income' | 'expense' | 'transfer' | 'investment';
  description: string;
  category: string;
  categoryConfidence: number;
  merchant?: string;
  date: Date;
  tags?: string[];
  notes?: string;
  anomalyScore: number;
  isAnomaly: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TransactionStats {
  totalIncome: number;
  totalExpense: number;
  byCategory: Record<string, number>;
  avgTransaction: number;
  largestTransaction: number;
}

const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: `${API_URL}/transactions`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add token to all requests
  instance.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
};

/**
 * Get transactions with optional filters
 */
export async function getTransactions(filters?: {
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}): Promise<Transaction[]> {
  try {
    const api = createAxiosInstance();
    const params = new URLSearchParams();

    if (filters?.accountId) params.append('accountId', filters.accountId);
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters?.category) params.append('category', filters.category);
    if (filters?.minAmount) params.append('minAmount', String(filters.minAmount));
    if (filters?.maxAmount) params.append('maxAmount', String(filters.maxAmount));
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    throw error;
  }
}

/**
 * Get transaction details
 */
export async function getTransaction(transactionId: string): Promise<Transaction> {
  try {
    const api = createAxiosInstance();
    const response = await api.get(`/${transactionId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch transaction ${transactionId}:`, error);
    throw error;
  }
}

/**
 * Categorize a single transaction
 */
export async function categorizeTransaction(
  transactionId: string,
  category: string
): Promise<Transaction> {
  try {
    const api = createAxiosInstance();
    const response = await api.put(`/${transactionId}/categorize`, { category });
    return response.data;
  } catch (error) {
    console.error(`Failed to categorize transaction ${transactionId}:`, error);
    throw error;
  }
}

/**
 * Bulk categorize uncategorized transactions
 */
export async function bulkCategorizeTransactions(): Promise<{
  categorized: number;
  skipped: number;
}> {
  try {
    const api = createAxiosInstance();
    const response = await api.post('/bulk/categorize');
    return response.data;
  } catch (error) {
    console.error('Failed to bulk categorize transactions:', error);
    throw error;
  }
}

/**
 * Get transaction statistics for a period
 */
export async function getTransactionStats(
  period: 'month' | 'year' = 'month'
): Promise<TransactionStats> {
  try {
    const api = createAxiosInstance();
    const response = await api.get(`/stats?period=${period}`);
    return response.data;
  } catch (error) {
    console.error('Failed to fetch transaction stats:', error);
    throw error;
  }
}

/**
 * Sync transactions from Plaid for an account
 */
export async function syncTransactionsFromPlaid(accountId: string): Promise<{
  synced: number;
  lastSync: Date;
}> {
  try {
    const api = createAxiosInstance();
    const response = await api.post(`/sync/${accountId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to sync transactions for account ${accountId}:`, error);
    throw error;
  }
}
