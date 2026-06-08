import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface TransactionFilters {
  accountId?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {}

  @Post('sync/:accountId')
  async syncFromPlaid(@Request() req, @Param('accountId') accountId: string) {
    return this.transactionsService.syncTransactionsFromPlaid(req.user.sub, accountId);
  }

  @Get()
  async getTransactions(@Request() req, @Query() filters: TransactionFilters) {
    const dateFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    return this.transactionsService.getTransactions(req.user.sub, dateFilters);
  }

  @Get('stats')
  async getStats(@Request() req, @Query('period') period: 'month' | 'year' = 'month') {
    return this.transactionsService.getTransactionStats(req.user.sub, period);
  }

  @Get(':id')
  async getTransaction(@Request() req, @Param('id') transactionId: string) {
    return this.transactionsService.getTransaction(transactionId, req.user.sub);
  }

  @Put(':id/categorize')
  async categorizeTransaction(
    @Request() req,
    @Param('id') transactionId: string,
    @Body() body: { category: string },
  ) {
    return this.transactionsService.categorizeTransaction(transactionId, req.user.sub, body.category);
  }

  @Post('bulk/categorize')
  async bulkCategorize(@Request() req) {
    return this.transactionsService.bulkCategorizeUncategorized(req.user.sub);
  }
}
