import { Module } from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import { IntelligenceController } from './intelligence.controller';
import { LSTMForecaster } from './lstm-forecaster';
import { IsolationForest } from './isolation-forest';
import { RecommendationEngine } from './recommendation-engine';
import { DataModule } from '@financial-hub/data';

@Module({
  imports: [DataModule],
  controllers: [IntelligenceController],
  providers: [IntelligenceService, LSTMForecaster, IsolationForest, RecommendationEngine],
  exports: [IntelligenceService],
})
export class IntelligenceModule {}
