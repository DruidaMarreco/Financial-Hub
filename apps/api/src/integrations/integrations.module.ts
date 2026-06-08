import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { IntegrationsController } from './integrations.controller';
import { CryptoWalletService } from './crypto-wallet.service';
import { StockBrokerService } from './stock-broker.service';
import { RealEstateService } from './real-estate.service';
import { AssetAggregatorService } from './asset-aggregator.service';
import { RevolutService } from './revolut.service';
import { IntegrationsService } from './integrations.service';
import { DataModule } from '@financial-hub/data';

@Module({
  imports: [DataModule, HttpModule],
  controllers: [IntegrationsController],
  providers: [
    CryptoWalletService,
    StockBrokerService,
    RealEstateService,
    AssetAggregatorService,
    RevolutService,
    IntegrationsService,
  ],
  exports: [
    CryptoWalletService,
    StockBrokerService,
    RealEstateService,
    AssetAggregatorService,
    RevolutService,
    IntegrationsService,
  ],
})
export class IntegrationsModule {}
