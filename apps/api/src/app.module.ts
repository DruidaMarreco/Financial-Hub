import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { DataModule } from '@financial-hub/data';

@Module({
  imports: [DataModule, AuthModule, AccountsModule, TransactionsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
