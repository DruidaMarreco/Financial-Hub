import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CryptoWalletService } from './crypto-wallet.service';
import { StockBrokerService } from './stock-broker.service';
import { RealEstateService } from './real-estate.service';
import { AssetAggregatorService } from './asset-aggregator.service';

@Controller('integrations')
@UseGuards(JwtAuthGuard)
export class IntegrationsController {
  constructor(
    private cryptoService: CryptoWalletService,
    private stockService: StockBrokerService,
    private realEstateService: RealEstateService,
    private aggregator: AssetAggregatorService,
  ) {}

  // CRYPTO ENDPOINTS
  @Get('crypto/wallet/:address')
  async getCryptoWallet(@Param('address') address: string) {
    return this.cryptoService.getEthereumWallet(address);
  }

  @Post('crypto/portfolio')
  async buildCryptoPortfolio(
    @Body() assets: Array<{ id: string; quantity: number }>,
  ) {
    return this.cryptoService.buildPortfolio(assets);
  }

  @Get('crypto/price/:id')
  async getCryptoPrice(@Param('id') id: string) {
    const price = await this.cryptoService.getCryptoPrice(id);
    return { id, price };
  }

  @Get('crypto/trends')
  async getCryptoTrends() {
    return this.cryptoService.getMarketTrends();
  }

  // STOCK ENDPOINTS
  @Get('stocks/price/:symbol')
  async getStockPrice(
    @Param('symbol') symbol: string,
    @Request() req,
  ) {
    return this.stockService.getStockPrice(symbol);
  }

  @Post('stocks/portfolio')
  async buildStockPortfolio(
    @Body()
    holdings: Array<{
      symbol: string;
      quantity: number;
      costBasis: number;
    }>,
  ) {
    return this.stockService.buildPortfolio(holdings);
  }

  @Get('stocks/fundamentals/:symbol')
  async getStockFundamentals(@Param('symbol') symbol: string) {
    return this.stockService.getStockFundamentals(symbol);
  }

  // REAL ESTATE ENDPOINTS
  @Post('realestate/estimate')
  async getPropertyEstimate(
    @Body() body: { address: string; zipCode: string },
  ) {
    return this.realEstateService.getPropertyEstimate(body.address, body.zipCode);
  }

  @Post('realestate/mortgage-calculator')
  async calculateMortgage(
    @Body() body: { loanAmount: number; interestRate: number; months: number },
  ) {
    return this.realEstateService.calculateMortgage(
      body.loanAmount,
      body.interestRate,
      body.months,
    );
  }

  @Post('realestate/portfolio')
  async buildRealEstatePortfolio(@Body() properties: any[]) {
    return this.realEstateService.buildPortfolio(properties);
  }

  @Post('realestate/roi')
  async calculatePropertyROI(@Body() property: any) {
    return this.realEstateService.calculateROI(property);
  }

  @Post('realestate/diversification')
  async analyzeDiversification(@Body() properties: any[]) {
    return this.realEstateService.analyzeDiversification(properties);
  }

  @Post('realestate/tax-insights')
  async getTaxInsights(@Body() properties: any[]) {
    return this.realEstateService.getTaxInsights(properties);
  }

  // ASSET AGGREGATOR ENDPOINTS
  @Post('networth')
  async calculateNetWorth(
    @Body()
    body: {
      bankAccounts: Array<{ balance: number }>;
      cryptoWallets: Array<{ address: string; chain: string }>;
      stockHoldings: Array<{ symbol: string; quantity: number; costBasis: number }>;
      properties: any[];
      liabilities: {
        mortgages: number;
        carLoans: number;
        creditCard: number;
        studentLoans: number;
        other: number;
      };
    },
    @Request() req,
  ) {
    return this.aggregator.calculateNetWorth(
      body.bankAccounts,
      body.cryptoWallets,
      body.stockHoldings,
      body.properties,
      body.liabilities,
    );
  }

  @Get('allocation/recommend/:age/:riskTolerance')
  async recommendAllocation(
    @Param('age') age: number,
    @Param('riskTolerance') riskTolerance: 'conservative' | 'moderate' | 'aggressive',
  ) {
    return this.aggregator.recommendAllocation(+age, riskTolerance);
  }

  @Post('allocation/analyze')
  async analyzeAllocation(
    @Body()
    body: {
      current: Record<string, number>;
      recommended: Record<string, number>;
    },
  ) {
    return this.aggregator.analyzeAllocation(body.current, body.recommended);
  }

  @Post('diversification')
  async calculateDiversification(
    @Body()
    assets: Array<{
      type: 'bank' | 'crypto' | 'stock' | 'real-estate' | 'bond' | 'vehicle';
      name: string;
      value: number;
      currency: string;
    }>,
  ) {
    return this.aggregator.calculateDiversification(assets);
  }

  @Post('networth/project')
  async projectNetWorth(
    @Body()
    body: {
      currentNetWorth: number;
      monthlyContribution: number;
      annualReturn: number;
      years: number;
    },
  ) {
    return this.aggregator.projectNetWorth(
      body.currentNetWorth,
      body.monthlyContribution,
      body.annualReturn,
      body.years,
    );
  }
}
