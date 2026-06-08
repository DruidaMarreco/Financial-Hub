import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('networth')
  async getNetWorth(@Request() req) {
    return this.analyticsService.getNetWorthTimeSeries(req.user.sub);
  }

  @Get('cashflow')
  async getCashFlow(@Request() req) {
    return this.analyticsService.getCashFlowData(req.user.sub);
  }

  @Get('heatmap')
  async getHeatmap(@Request() req) {
    return this.analyticsService.getExpenseHeatmap(req.user.sub);
  }

  @Get('forecast')
  async getForecast(@Request() req, @Query('months') months: string = '6') {
    return this.analyticsService.getSpendingForecast(req.user.sub, parseInt(months));
  }

  @Get('goals')
  async getGoals(@Request() req) {
    return this.analyticsService.getFinancialGoals(req.user.sub);
  }

  @Get('investments')
  async getInvestments(@Request() req) {
    return this.analyticsService.getInvestmentMetrics(req.user.sub);
  }

  @Get('dashboard/universe')
  async getDashboardUniverse(@Request() req) {
    const accounts = await this.analyticsService.getNetWorthTimeSeries(req.user.sub);
    const goals = await this.analyticsService.getFinancialGoals(req.user.sub);
    return { accounts, goals };
  }

  @Get('dashboard/freedom')
  async getDashboardFreedom(@Request() req) {
    return this.analyticsService.getFinancialGoals(req.user.sub);
  }
}
