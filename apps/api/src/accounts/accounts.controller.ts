import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAccountDto, UpdateAccountDto } from '@financial-hub/common';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private accountsService: AccountsService) {}

  @Post()
  async createAccount(@Request() req, @Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.createAccount(req.user.sub, createAccountDto);
  }

  @Get()
  async getAccounts(@Request() req) {
    return this.accountsService.getAccounts(req.user.sub);
  }

  @Get(':id')
  async getAccount(@Request() req, @Param('id') accountId: string) {
    return this.accountsService.getAccount(accountId, req.user.sub);
  }

  @Put(':id')
  async updateAccount(
    @Request() req,
    @Param('id') accountId: string,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    return this.accountsService.updateAccount(accountId, req.user.sub, updateAccountDto);
  }

  @Delete(':id')
  async deleteAccount(@Request() req, @Param('id') accountId: string) {
    return this.accountsService.deleteAccount(accountId, req.user.sub);
  }

  @Get('metrics/networth')
  async getNetWorth(@Request() req) {
    return this.accountsService.getUserTotalNetWorth(req.user.sub);
  }
}
