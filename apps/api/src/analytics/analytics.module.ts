import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Forecaster } from '../ml/forecaster';
import { AnomalyDetector } from '../ml/anomaly-detector';
import { DataModule } from '@financial-hub/data';

@Module({
  imports: [DataModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, Forecaster, AnomalyDetector],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
