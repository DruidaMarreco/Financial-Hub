import { Injectable } from '@nestjs/common';
import axios from 'axios';

interface CryptoAsset {
  symbol: string;
  name: string;
  quantity: number;
  currentPrice: number;
  totalValue: number;
  chain?: string;
  address?: string;
  lastUpdated: Date;
}

interface CryptoWallet {
  address: string;
  chain: 'ethereum' | 'bitcoin' | 'polygon' | 'solana' | 'arbitrum';
  balance: number;
  assets: CryptoAsset[];
  totalValue: number;
}

@Injectable()
export class CryptoWalletService {
  private readonly ETHERSCAN_API = 'https://api.etherscan.io/api';
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3';

  /**
   * Fetch wallet balance for Ethereum address using Etherscan
   */
  async getEthereumWallet(address: string, etherscanApiKey?: string): Promise<CryptoWallet> {
    try {
      // Validate address
      if (!address || address.length !== 42 || !address.startsWith('0x')) {
        throw new Error('Invalid Ethereum address');
      }

      const params = {
        module: 'account',
        action: 'balance',
        address,
        tag: 'latest',
        ...(etherscanApiKey && { apikey: etherscanApiKey }),
      };

      const response = await axios.get(this.ETHERSCAN_API, { params });

      if (response.data.status !== '1') {
        throw new Error('Failed to fetch Ethereum balance');
      }

      const balanceWei = response.data.result;
      const balanceEth = parseInt(balanceWei) / 1e18;

      // Get current ETH price
      const ethPrice = await this.getCryptoPrice('ethereum');

      return {
        address,
        chain: 'ethereum',
        balance: balanceEth,
        assets: [
          {
            symbol: 'ETH',
            name: 'Ethereum',
            quantity: balanceEth,
            currentPrice: ethPrice,
            totalValue: balanceEth * ethPrice,
            chain: 'ethereum',
            address,
            lastUpdated: new Date(),
          },
        ],
        totalValue: balanceEth * ethPrice,
      };
    } catch (error) {
      throw new Error(`Failed to fetch Ethereum wallet: ${error.message}`);
    }
  }

  /**
   * Fetch crypto asset price from CoinGecko
   */
  async getCryptoPrice(cryptoId: string): Promise<number> {
    try {
      const response = await axios.get(`${this.COINGECKO_API}/simple/price`, {
        params: {
          ids: cryptoId,
          vs_currencies: 'usd',
        },
      });

      return response.data[cryptoId]?.usd || 0;
    } catch (error) {
      console.error(`Failed to fetch price for ${cryptoId}:`, error);
      return 0;
    }
  }

  /**
   * Get prices for multiple crypto assets
   */
  async getCryptoPrices(cryptoIds: string[]): Promise<Record<string, number>> {
    try {
      const response = await axios.get(`${this.COINGECKO_API}/simple/price`, {
        params: {
          ids: cryptoIds.join(','),
          vs_currencies: 'usd',
        },
      });

      const prices: Record<string, number> = {};
      for (const [id, data] of Object.entries(response.data)) {
        prices[id] = (data as any).usd || 0;
      }
      return prices;
    } catch (error) {
      console.error('Failed to fetch crypto prices:', error);
      return {};
    }
  }

  /**
   * Build a portfolio from multiple crypto assets
   */
  async buildPortfolio(assets: Array<{ id: string; quantity: number }>): Promise<{
    totalValue: number;
    assets: CryptoAsset[];
    gainLoss?: number;
    gainLossPercent?: number;
  }> {
    try {
      const cryptoIds = assets.map(a => a.id);
      const prices = await this.getCryptoPrices(cryptoIds);

      const portfolioAssets: CryptoAsset[] = assets.map(asset => {
        const price = prices[asset.id] || 0;
        return {
          symbol: asset.id.toUpperCase(),
          name: asset.id.charAt(0).toUpperCase() + asset.id.slice(1),
          quantity: asset.quantity,
          currentPrice: price,
          totalValue: asset.quantity * price,
          lastUpdated: new Date(),
        };
      });

      const totalValue = portfolioAssets.reduce((sum, a) => sum + a.totalValue, 0);

      return {
        totalValue,
        assets: portfolioAssets,
      };
    } catch (error) {
      throw new Error(`Failed to build portfolio: ${error.message}`);
    }
  }

  /**
   * Get crypto market data and trending coins
   */
  async getMarketTrends(): Promise<{
    topGainers: Array<{ name: string; change24h: number; price: number }>;
    topLosers: Array<{ name: string; change24h: number; price: number }>;
    marketCap: number;
  }> {
    try {
      const response = await axios.get(`${this.COINGECKO_API}/global`);

      const marketData = response.data.data;

      return {
        topGainers: [],
        topLosers: [],
        marketCap: marketData.total_market_cap?.usd || 0,
      };
    } catch (error) {
      console.error('Failed to fetch market trends:', error);
      return {
        topGainers: [],
        topLosers: [],
        marketCap: 0,
      };
    }
  }

  /**
   * Calculate portfolio allocation
   */
  calculateAllocation(assets: CryptoAsset[]): Record<string, number> {
    const totalValue = assets.reduce((sum, a) => sum + a.totalValue, 0);

    if (totalValue === 0) return {};

    const allocation: Record<string, number> = {};
    for (const asset of assets) {
      allocation[asset.symbol] = (asset.totalValue / totalValue) * 100;
    }

    return allocation;
  }

  /**
   * Detect portfolio diversification issues
   */
  detectConcentration(assets: CryptoAsset[], threshold: number = 50): {
    isConcentrated: boolean;
    largestAsset: string;
    largestAllocation: number;
  } {
    const totalValue = assets.reduce((sum, a) => sum + a.totalValue, 0);

    if (totalValue === 0) {
      return { isConcentrated: false, largestAsset: '', largestAllocation: 0 };
    }

    const allocations = assets.map(a => ({
      symbol: a.symbol,
      percent: (a.totalValue / totalValue) * 100,
    }));

    const largest = allocations.reduce((a, b) => (a.percent > b.percent ? a : b));

    return {
      isConcentrated: largest.percent > threshold,
      largestAsset: largest.symbol,
      largestAllocation: largest.percent,
    };
  }
}
