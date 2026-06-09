import { useEffect, useState, useCallback } from 'react';
import * as transactionsService from '../services/transactions';

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

export interface TransactionFilters {
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface TransactionStats {
  totalIncome: number;
  totalExpense: number;
  byCategory: Record<string, number>;
  avgTransaction: number;
  largestTransaction: number;
}

/**
 * Custom hook for managing transactions with API integration
 * Handles loading, filtering, and common operations
 */
export function useTransactions(initialFilters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>(
    initialFilters || {}
  );

  // Load transactions on mount and when filters change
  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = useCallback(async (newFilters?: TransactionFilters) => {
    try {
      setLoading(true);
      setError(null);
      const filtersToUse = newFilters || filters;
      const data = await transactionsService.getTransactions(filtersToUse);
      setTransactions(data);
      if (newFilters) {
        setFilters(newFilters);
      }
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      setError(
        err.response?.data?.message || 'Failed to load transactions'
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const updateFilters = useCallback(
    (newFilters: TransactionFilters) => {
      loadTransactions(newFilters);
    },
    [loadTransactions]
  );

  const categorizeTransaction = useCallback(
    async (transactionId: string, category: string) => {
      try {
        setError(null);
        const updated = await transactionsService.categorizeTransaction(
          transactionId,
          category
        );
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === transactionId ? updated : tx))
        );
        return updated;
      } catch (err: any) {
        const errorMsg =
          err.response?.data?.message || 'Failed to categorize transaction';
        setError(errorMsg);
        throw err;
      }
    },
    []
  );

  const bulkCategorize = useCallback(async () => {
    try {
      setError(null);
      const result = await transactionsService.bulkCategorizeTransactions();
      // Reload transactions after bulk categorization
      await loadTransactions();
      return result;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || 'Failed to categorize transactions';
      setError(errorMsg);
      throw err;
    }
  }, [loadTransactions]);

  const getStats = useCallback(async (period: 'month' | 'year' = 'month') => {
    try {
      setError(null);
      return await transactionsService.getTransactionStats(period);
    } catch (err: any) {
      console.error('Failed to get stats:', err);
      throw err;
    }
  }, []);

  const syncFromPlaid = useCallback(async (accountId: string) => {
    try {
      setError(null);
      const result = await transactionsService.syncTransactionsFromPlaid(
        accountId
      );
      // Reload transactions after sync
      await loadTransactions();
      return result;
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || 'Failed to sync transactions';
      setError(errorMsg);
      throw err;
    }
  }, [loadTransactions]);

  // Calculate derived data
  const totalIncome = transactions
    .filter((tx) => tx.type === 'income')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

  const byCategory = transactions.reduce(
    (acc, tx) => {
      if (tx.type === 'expense') {
        acc[tx.category] = (acc[tx.category] || 0) + Math.abs(tx.amount);
      }
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    // State
    transactions,
    loading,
    error,
    filters,

    // Derived data
    totalIncome,
    totalExpense,
    byCategory,

    // Operations
    loadTransactions,
    updateFilters,
    categorizeTransaction,
    bulkCategorize,
    getStats,
    syncFromPlaid,
  };
}
