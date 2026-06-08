import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DataModule } from '@financial-hub/data';

@Module({
  imports: [DataModule, AuthModule, AccountsModule, TransactionsModule, AnalyticsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
