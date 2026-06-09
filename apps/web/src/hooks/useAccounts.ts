import { useEffect, useState, useCallback } from 'react';
import * as accountsService from '../services/accounts';

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

export interface UseAccountsState {
  accounts: Account[];
  loading: boolean;
  error: string | null;
  totalBalance: number;
}

/**
 * Custom hook for managing accounts with API integration
 * Handles loading, error states, and common operations
 */
export function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load accounts on mount
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await accountsService.getAccounts();
      setAccounts(data);
    } catch (err: any) {
      console.error('Failed to load accounts:', err);
      setError(err.response?.data?.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  const createAccount = useCallback(
    async (data: {
      name: string;
      accountNumber: string;
      type: string;
      currency: string;
      institution: string;
    }) => {
      try {
        setError(null);
        const newAccount = await accountsService.createAccount(data);
        setAccounts((prev) => [...prev, newAccount]);
        return newAccount;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to create account';
        setError(errorMsg);
        throw err;
      }
    },
    []
  );

  const updateAccount = useCallback(
    async (
      id: string,
      data: Partial<Omit<Account, 'id' | 'createdAt'>>
    ) => {
      try {
        setError(null);
        const updated = await accountsService.updateAccount(id, data);
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === id ? updated : acc))
        );
        return updated;
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to update account';
        setError(errorMsg);
        throw err;
      }
    },
    []
  );

  const deleteAccount = useCallback(async (id: string) => {
    try {
      setError(null);
      await accountsService.deleteAccount(id);
      setAccounts((prev) => prev.filter((acc) => acc.id !== id));
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to delete account';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const getNetWorth = useCallback(async () => {
    try {
      setError(null);
      return await accountsService.getNetWorth();
    } catch (err: any) {
      console.error('Failed to get net worth:', err);
      throw err;
    }
  }, []);

  const syncTransactions = useCallback(async (accountId: string) => {
    try {
      setError(null);
      const result = await accountsService.syncTransactions(accountId);
      // Reload accounts after sync to get updated data
      await loadAccounts();
      return result;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to sync transactions';
      setError(errorMsg);
      throw err;
    }
  }, [loadAccounts]);

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return {
    // State
    accounts,
    loading,
    error,
    totalBalance,

    // Operations
    loadAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    getNetWorth,
    syncTransactions,
  };
}
