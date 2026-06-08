import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { CryptoWalletService } from './crypto-wallet.service';
import { StockBrokerService } from './stock-broker.service';
import { RealEstateService } from './real-estate.service';
import { AssetAggregatorService } from './asset-aggregator.service';
import { DataModule } from '@financial-hub/data';

@Module({
  imports: [DataModule],
  controllers: [IntegrationsController],
  providers: [
    CryptoWalletService,
    StockBrokerService,
    RealEstateService,
    AssetAggregatorService,
  ],
  exports: [
    CryptoWalletService,
    StockBrokerService,
    RealEstateService,
    AssetAggregatorService,
  ],
})
export class IntegrationsModule {}
