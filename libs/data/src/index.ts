// Re-export Prisma client
export { PrismaClient } from '@prisma/client';
export type {
  User,
  UserProfile,
  Account,
  Transaction,
  TransactionCategory,
  Portfolio,
  Holding,
  PortfolioMetrics,
} from '@prisma/client';

// Database utilities
export * from './db/prisma.service';
