import { Injectable } from '@nestjs/common';
import { CryptoWalletService } from './crypto-wallet.service';
import { StockBrokerService } from './stock-broker.service';
import { RealEstateService } from './real-estate.service';

interface Asset {
  type: 'bank' | 'crypto' | 'stock' | 'real-estate' | 'bond' | 'vehicle';
  name: string;
  value: number;
  currency: string;
}

interface NetWorthSnapshot {
  date: Date;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  breakdown: {
    bank: number;
    crypto: number;
    stocks: number;
    realEstate: number;
    vehicles: number;
    bonds: number;
    other: number;
  };
  liabilityBreakdown: {
    mortgages: number;
    carLoans: number;
    creditCard: number;
    studentLoans: number;
    other: number;
  };
}

interface AssetAllocation {
  type: string;
  value: number;
  percent: number;
  recommendation: string;
}

@Injectable()
export class AssetAggregatorService {
  constructor(
    private cryptoService: CryptoWalletService,
    private stockService: StockBrokerService,
    private realEstateService: RealEstateService,
  ) {}

  /**
   * Calculate comprehensive net worth across all asset classes
   */
  async calculateNetWorth(
    bankAccounts: Array<{ balance: number }>,
    cryptoWallets: Array<{ address: string; chain: string }>,
    stockHoldings: Array<{ symbol: string; quantity: number; costBasis: number }>,
    properties: any[],
    liabilities: {
      mortgages: number;
      carLoans: number;
      creditCard: number;
      studentLoans: number;
      other: number;
    },
  ): Promise<NetWorthSnapshot> {
    // Bank assets
    const bankTotal = bankAccounts.reduce((sum, a) => sum + a.balance, 0);

    // Crypto assets
    let cryptoTotal = 0;
    for (const wallet of cryptoWallets) {
      try {
        const ethWallet = await this.cryptoService.getEthereumWallet(wallet.address);
        cryptoTotal += ethWallet.totalValue;
      } catch (error) {
        console.error(`Failed to get crypto wallet ${wallet.address}:`, error);
      }
    }

    // Stock assets
    const portfolio = this.stockService.buildPortfolio(stockHoldings);
    const stockTotal = portfolio.totalValue;

    // Real estate assets
    const realEstatePortfolio = this.realEstateService.buildPortfolio(properties);
    const realEstateTotal = realEstatePortfolio.totalValue;

    // Calculate totals
    const totalAssets = bankTotal + cryptoTotal + stockTotal + realEstateTotal;

    const totalLiabilities =
      liabilities.mortgages +
      liabilities.carLoans +
      liabilities.creditCard +
      liabilities.studentLoans +
      liabilities.other;

    const netWorth = totalAssets - totalLiabilities;

    return {
      date: new Date(),
      totalAssets,
      totalLiabilities,
      netWorth,
      breakdown: {
        bank: bankTotal,
        crypto: cryptoTotal,
        stocks: stockTotal,
        realEstate: realEstateTotal,
        vehicles: 0,
        bonds: 0,
        other: 0,
      },
      liabilityBreakdown: liabilities,
    };
  }

  /**
   * Recommend asset allocation based on age and risk tolerance
   */
  recommendAllocation(age: number, riskTolerance: 'conservative' | 'moderate' | 'aggressive'): Record<string, number> {
    const yearsToRetirement = Math.max(0, 65 - age);

    // Age-based allocation (rule of thumb: bonds = your age)
    let stocks = 100 - age;
    let bonds = age;

    // Adjust for risk tolerance
    if (riskTolerance === 'conservative') {
      stocks = Math.min(stocks, 40);
      bonds = Math.max(bonds, 60);
    } else if (riskTolerance === 'aggressive') {
      stocks = Math.min(stocks + 20, 90);
      bonds = Math.max(bonds - 20, 10);
    }

    // Add alternative assets for younger investors
    let realEstate = 0;
    let crypto = 0;
    let cash = 0;

    if (age < 50) {
      realEstate = 10; // Real estate for younger investors
      crypto = riskTolerance === 'aggressive' ? 5 : riskTolerance === 'moderate' ? 2 : 0;
      cash = 5;
    } else {
      cash = 10;
    }

    // Normalize to 100%
    const total = stocks + bonds + realEstate + crypto + cash;

    return {
      stocks: (stocks / total) * 100,
      bonds: (bonds / total) * 100,
      realEstate: (realEstate / total) * 100,
      crypto: (crypto / total) * 100,
      cash: (cash / total) * 100,
    };
  }

  /**
   * Analyze current allocation vs recommended
   */
  analyzeAllocation(
    current: Record<string, number>,
    recommended: Record<string, number>,
  ): {
    allocations: AssetAllocation[];
    rebalancingNeeded: boolean;
    suggestions: string[];
  } {
    const currentTotal = Object.values(current).reduce((a, b) => a + b, 0);
    const allocations: AssetAllocation[] = [];
    const suggestions: string[] = [];

    for (const [type, recommendedPercent] of Object.entries(recommended)) {
      const currentValue = current[type] || 0;
      const currentPercent = currentTotal > 0 ? (currentValue / currentTotal) * 100 : 0;
      const difference = currentPercent - recommendedPercent;

      let recommendation = '';
      if (Math.abs(difference) > 5) {
        if (difference > 0) {
          recommendation = `Rebalance: Consider reducing ${type} by ${Math.abs(difference).toFixed(1)}%`;
          suggestions.push(recommendation);
        } else {
          recommendation = `Rebalance: Consider increasing ${type} by ${Math.abs(difference).toFixed(1)}%`;
          suggestions.push(recommendation);
        }
      }

      allocations.push({
        type,
        value: currentValue,
        percent: currentPercent,
        recommendation,
      });
    }

    const rebalancingNeeded = suggestions.length > 0;

    return {
      allocations,
      rebalancingNeeded,
      suggestions,
    };
  }

  /**
   * Calculate asset correlation and diversification score
   */
  calculateDiversification(assets: Asset[]): {
    score: number; // 0-100, higher = more diversified
    byType: Record<string, number>;
    risks: string[];
  } {
    const totalValue = assets.reduce((sum, a) => sum + a.value, 0);

    if (totalValue === 0) {
      return {
        score: 0,
        byType: {},
        risks: ['No assets'],
      };
    }

    // Calculate allocation by type
    const byType: Record<string, number> = {};
    for (const asset of assets) {
      byType[asset.type] = (byType[asset.type] || 0) + asset.value;
    }

    // Convert to percentages
    const percentages: Record<string, number> = {};
    for (const [type, value] of Object.entries(byType)) {
      percentages[type] = (value / totalValue) * 100;
    }

    // Calculate Herfindahl index (concentration measure)
    let herfindahl = 0;
    for (const percent of Object.values(percentages)) {
      herfindahl += Math.pow(percent, 2);
    }

    // Convert to 0-100 diversification score (100 = perfectly diversified)
    const diversificationScore = Math.max(0, 100 - herfindahl / 10);

    // Identify risks
    const risks: string[] = [];
    const maxAllocation = Math.max(...Object.values(percentages));

    if (maxAllocation > 80) {
      risks.push('Severe concentration risk - diversify immediately');
    } else if (maxAllocation > 60) {
      risks.push('High concentration risk');
    } else if (maxAllocation > 40) {
      risks.push('Moderate concentration - consider diversifying');
    }

    if (!percentages['stocks'] && !percentages['bonds']) {
      risks.push('No traditional investments - consider adding stocks/bonds');
    }

    if (!percentages['realEstate'] && !percentages['crypto']) {
      risks.push('No alternative assets - consider diversification');
    }

    return {
      score: Math.round(diversificationScore * 10) / 10,
      byType: percentages,
      risks,
    };
  }

  /**
   * Project net worth growth
   */
  projectNetWorth(
    currentNetWorth: number,
    monthlyContribution: number,
    annualReturn: number,
    years: number,
  ): Array<{
    year: number;
    projectedNetWorth: number;
    contribution: number;
    investment_growth: number;
  }> {
    const projections: Array<{
      year: number;
      projectedNetWorth: number;
      contribution: number;
      investment_growth: number;
    }> = [];

    let balance = currentNetWorth;

    for (let year = 1; year <= years; year++) {
      const annualContribution = monthlyContribution * 12;
      balance += annualContribution;

      const investmentGrowth = balance * (annualReturn / 100);
      balance += investmentGrowth;

      projections.push({
        year,
        projectedNetWorth: Math.round(balance * 100) / 100,
        contribution: annualContribution,
        investment_growth: Math.round(investmentGrowth * 100) / 100,
      });
    }

    return projections;
  }
}
