import axios from 'axios';
import { getAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Account {
  id: string;
  name: string;
  accountNumber: string;
  type: string;
  status: string;
  balance: number;
  currency: string;
  institution: string;
  lastSync?: Date;
  monthlySpend: number;
  createdAt?: Date;
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  categoryConfidence?: number;
  merchant?: string;
  tags?: string[];
  isAnomaly?: boolean;
  anomalyScore?: number;
}

const createAxiosInstance = () => {
  const instance = axios.create({
    baseURL: `${API_URL}/accounts`,
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
 * Get all accounts for the current user
 */
export async function getAccounts(): Promise<Account[]> {
  try {
    const api = createAxiosInstance();
    const response = await api.get('/');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    throw error;
  }
}

/**
 * Get a specific account with its transactions
 */
export async function getAccount(accountId: string): Promise<Account & { transactions?: Transaction[] }> {
  try {
    const api = createAxiosInstance();
    const response = await api.get(`/${accountId}`);
    return response.data;
  } catch (error) {
    console.error(`Failed to fetch account ${accountId}:`, error);
    throw error;
  }
}

/**
 * Create a new account
 */
export async function createAccount(data: {
  name: string;
  accountNumber: string;
  type: string;
  currency: string;
  institution: string;
}): Promise<Account> {
  try {
    const api = createAxiosInstance();
    const response = await api.post('/', data);
    return response.data;
  } catch (error) {
    console.error('Failed to create account:', error);
    throw error;
  }
}

/**
 * Update an account
 */
export async function updateAccount(
  accountId: string,
  data: Partial<Omit<Account, 'id' | 'createdAt'>>
): Promise<Account> {
  try {
    const api = createAxiosInstance();
    const response = await api.put(`/${accountId}`, data);
    return response.data;
  } catch (error) {
    console.error(`Failed to update account ${accountId}:`, error);
    throw error;
  }
}

/**
 * Delete an account
 */
export async function deleteAccount(accountId: string): Promise<void> {
  try {
    const api = createAxiosInstance();
    await api.delete(`/${accountId}`);
  } catch (error) {
    console.error(`Failed to delete account ${accountId}:`, error);
    throw error;
  }
}

/**
 * Get net worth across all accounts
 */
export async function getNetWorth(): Promise<{
  totalBalance: number;
  currency: string;
  byType: Record<string, number>;
}> {
  try {
    const api = createAxiosInstance();
    const response = await api.get('/metrics/networth');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch net worth:', error);
    throw error;
  }
}

/**
 * Sync transactions from Plaid for an account
 */
export async function syncTransactions(accountId: string): Promise<{
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
