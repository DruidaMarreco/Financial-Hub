import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PlaidService } from './plaid.service';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface ExchangeTokenRequest {
  publicToken: string;
  metadata: {
    accounts: Array<{ id: string; name: string; type: string }>;
  };
}

@Controller('plaid')
@UseGuards(JwtAuthGuard)
export class PlaidController {
  constructor(
    private plaidService: PlaidService,
    private accountsService: AccountsService,
  ) {}

  @Post('link-token')
  async createLinkToken(@Request() req) {
    return this.plaidService.createLinkToken(req.user.sub);
  }

  @Post('exchange-token')
  async exchangeToken(@Request() req, @Body() body: ExchangeTokenRequest) {
    const userId = req.user.sub;
    const { publicToken, metadata } = body;

    // Exchange public token for access token
    const { access_token, item_id } = await this.plaidService.exchangePublicToken(
      userId,
      publicToken,
    );

    // Get Plaid accounts
    const plaidAccounts = await this.plaidService.getAccounts(access_token);

    // Create accounts in database
    const createdAccounts = [];
    for (const plaidAccount of plaidAccounts) {
      const account = await this.accountsService.createAccount(userId, {
        name: plaidAccount.name || 'Connected Account',
        accountNumber: plaidAccount.account_number || plaidAccount.id,
        type: plaidAccount.subtype || 'bank',
        currency: plaidAccount.balances?.iso_currency_code || 'USD',
        institution: 'Plaid-Connected Bank',
      });

      // Store access token (in real app, encrypt this)
      await this.plaidService.storeAccessToken(userId, plaidAccount.name, access_token);

      createdAccounts.push(account);
    }

    return {
      success: true,
      accountsCreated: createdAccounts.length,
      accounts: createdAccounts,
      message: `Successfully linked ${createdAccounts.length} account(s)`,
    };
  }
}
