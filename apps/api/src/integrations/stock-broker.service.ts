import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface StockHolding {
  symbol: string;
  name: string;
  quantity: number;
  currentPrice: number;
  costBasis: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  sector?: string;
  lastUpdated: Date;
}

interface StockPortfolio {
  brokerage: string;
  holdings: StockHolding[];
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

@Injectable()
export class StockBrokerService {
  private readonly FINNHUB_API = 'https://finnhub.io/api/v1';
  private readonly ALPHA_VANTAGE_API = 'https://www.alphavantage.co/query';

  /**
   * Fetch stock price and company info
   */
  async getStockPrice(symbol: string, apiKey?: string): Promise<{
    symbol: string;
    price: number;
    name: string;
    change: number;
    changePercent: number;
  }> {
    try {
      // Use Alpha Vantage as primary
      const params = {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: apiKey || 'demo', // demo for testing
      };

      const response = await axios.get(this.ALPHA_VANTAGE_API, { params });
      const quote = response.data['Global Quote'];

      if (!quote || !quote['05. price']) {
        throw new Error('Unable to fetch quote');
      }

      return {
        symbol,
        price: parseFloat(quote['05. price']),
        name: symbol,
        change: parseFloat(quote['09. change']) || 0,
        changePercent: parseFloat(quote['10. change percent']) || 0,
      };
    } catch (error) {
      console.error(`Failed to fetch stock price for ${symbol}:`, error);
      throw error;
    }
  }

  /**
   * Get prices for multiple stocks
   */
  async getStockPrices(symbols: string[], apiKey?: string): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};

    // Alpha Vantage has rate limits, so we batch requests
    for (const symbol of symbols) {
      try {
        const priceData = await this.getStockPrice(symbol, apiKey);
        prices[symbol] = priceData.price;
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}`);
        prices[symbol] = 0;
      }
    }

    return prices;
  }

  /**
   * Calculate portfolio metrics
   */
  buildPortfolio(holdings: Array<{ symbol: string; quantity: number; costBasis: number }>): StockPortfolio {
    // This would be populated with actual price data in production
    const stockHoldings: StockHolding[] = holdings.map(h => ({
      symbol: h.symbol,
      name: h.symbol,
      quantity: h.quantity,
      currentPrice: 0, // Would be fetched from API
      costBasis: h.costBasis,
      totalValue: h.quantity * 0, // quantity * currentPrice
      gainLoss: 0,
      gainLossPercent: 0,
      lastUpdated: new Date(),
    }));

    const totalValue = stockHoldings.reduce((sum, h) => sum + h.totalValue, 0);
    const totalCostBasis = stockHoldings.reduce((sum, h) => sum + h.costBasis, 0);
    const totalGainLoss = totalValue - totalCostBasis;
    const totalGainLossPercent = totalCostBasis > 0 ? (totalGainLoss / totalCostBasis) * 100 : 0;

    return {
      brokerage: 'manual',
      holdings: stockHoldings,
      totalValue,
      totalCostBasis,
      totalGainLoss,
      totalGainLossPercent,
    };
  }

  /**
   * Get stock fundamentals
   */
  async getStockFundamentals(symbol: string, apiKey?: string): Promise<{
    pe: number;
    dividend: number;
    marketCap: number;
    industry: string;
  }> {
    try {
      const params = {
        function: 'OVERVIEW',
        symbol,
        apikey: apiKey || 'demo',
      };

      const response = await axios.get(this.ALPHA_VANTAGE_API, { params });

      return {
        pe: parseFloat(response.data.TrailingPE) || 0,
        dividend: parseFloat(response.data.DividendPerShare) || 0,
        marketCap: parseFloat(response.data.MarketCapitalization) || 0,
        industry: response.data.Industry || 'Unknown',
      };
    } catch (error) {
      console.error(`Failed to fetch fundamentals for ${symbol}:`, error);
      return {
        pe: 0,
        dividend: 0,
        marketCap: 0,
        industry: '',
      };
    }
  }

  /**
   * Calculate sector allocation
   */
  calculateSectorAllocation(holdings: StockHolding[]): Record<string, number> {
    const sectorValues: Record<string, number> = {};
    const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);

    for (const holding of holdings) {
      const sector = holding.sector || 'Unknown';
      sectorValues[sector] = (sectorValues[sector] || 0) + holding.totalValue;
    }

    const allocation: Record<string, number> = {};
    for (const [sector, value] of Object.entries(sectorValues)) {
      allocation[sector] = (value / totalValue) * 100;
    }

    return allocation;
  }

  /**
   * Detect portfolio concentration risk
   */
  detectConcentration(holdings: StockHolding[], threshold: number = 20): {
    isConcentrated: boolean;
    topHoldings: Array<{ symbol: string; percent: number }>;
  } {
    const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);

    if (totalValue === 0) {
      return { isConcentrated: false, topHoldings: [] };
    }

    const percentages = holdings
      .map(h => ({
        symbol: h.symbol,
        percent: (h.totalValue / totalValue) * 100,
      }))
      .sort((a, b) => b.percent - a.percent);

    const topHoldings = percentages.slice(0, 5);
    const isConcentrated = topHoldings.some(h => h.percent > threshold);

    return {
      isConcentrated,
      topHoldings,
    };
  }

  /**
   * Calculate dividend income
   */
  calculateDividendIncome(holdings: StockHolding[]): {
    annualIncome: number;
    yieldPercent: number;
    byHolding: Array<{ symbol: string; income: number }>;
  } {
    const totalValue = holdings.reduce((sum, h) => sum + h.totalValue, 0);
    let annualIncome = 0;

    const byHolding = holdings
      .filter(h => (h.gainLossPercent || 0) > 0) // Filter for dividend payers
      .map(h => {
        const income = h.quantity * (h.gainLossPercent || 0); // Simplified calculation
        annualIncome += income;
        return { symbol: h.symbol, income };
      });

    return {
      annualIncome,
      yieldPercent: totalValue > 0 ? (annualIncome / totalValue) * 100 : 0,
      byHolding,
    };
  }

  /**
   * Detect duplicate or similar holdings
   */
  detectDuplicates(holdings: StockHolding[]): Array<{
    symbols: string[];
    reason: string;
  }> {
    const duplicates: Array<{ symbols: string[]; reason: string }> = [];

    // Check for exact symbol duplicates
    const symbolCounts: Record<string, string[]> = {};
    for (const holding of holdings) {
      if (!symbolCounts[holding.symbol]) {
        symbolCounts[holding.symbol] = [];
      }
      symbolCounts[holding.symbol].push(holding.symbol);
    }

    for (const [symbol, instances] of Object.entries(symbolCounts)) {
      if (instances.length > 1) {
        duplicates.push({
          symbols: instances,
          reason: 'duplicate_symbol',
        });
      }
    }

    return duplicates;
  }
}
