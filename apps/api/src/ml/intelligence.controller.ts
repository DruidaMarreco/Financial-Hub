import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { IntelligenceService } from './intelligence.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('intelligence')
@UseGuards(JwtAuthGuard)
export class IntelligenceController {
  constructor(private intelligenceService: IntelligenceService) {}

  @Get('insights')
  async getInsights(@Request() req) {
    return this.intelligenceService.getAdvancedInsights(req.user.sub);
  }

  @Get('recommendations')
  async getRecommendations(@Request() req) {
    return this.intelligenceService.getRecommendations(req.user.sub);
  }

  @Get('anomalies/advanced')
  async getAdvancedAnomalies(@Request() req) {
    return this.intelligenceService.getAdvancedAnomalies(req.user.sub);
  }
}
