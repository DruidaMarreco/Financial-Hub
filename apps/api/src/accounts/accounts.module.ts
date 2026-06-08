import { Module } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { PlaidService } from './plaid.service';
import { PlaidController } from './plaid.controller';
import { DataModule } from '@financial-hub/data';

@Module({
  imports: [DataModule],
  controllers: [AccountsController, PlaidController],
  providers: [AccountsService, PlaidService],
  exports: [AccountsService, PlaidService],
})
export class AccountsModule {}
