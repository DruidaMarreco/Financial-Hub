export interface Holding {
  id: string;
  portfolioId: string;
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: Date;
  currency: string;
}

export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  description?: string;
  totalValue: number;
  currency: string;
  holdings: Holding[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioMetrics {
  portfolioId: string;
  totalInvested: number;
  totalValue: number;
  totalGain: number;
  gainPercentage: number;
  dayChange: number;
  dayChangePercentage: number;
  calculatedAt: Date;
}
