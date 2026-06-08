import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { TransactionCategorizer } from '../ml/transaction-categorizer';
import { PlaidService } from '../accounts/plaid.service';
import { DataModule } from '@financial-hub/data';

@Module({
  imports: [DataModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, TransactionCategorizer, PlaidService],
  exports: [TransactionsService, TransactionCategorizer],
})
export class TransactionsModule {}
