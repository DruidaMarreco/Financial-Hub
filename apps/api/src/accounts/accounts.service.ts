import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@financial-hub/data';
import { CreateAccountDto, UpdateAccountDto } from '@financial-hub/common';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  async createAccount(userId: string, createAccountDto: CreateAccountDto) {
    const { name, accountNumber, type, currency, institution } = createAccountDto;

    const account = await this.prisma.account.create({
      data: {
        userId,
        name,
        accountNumber,
        type,
        currency,
        institution,
        balance: 0,
        status: 'active',
      },
    });

    return account;
  }

  async getAccounts(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        type: true,
        balance: true,
        currency: true,
        institution: true,
        status: true,
        lastSync: true,
        createdAt: true,
      },
    });

    return accounts;
  }

  async getAccount(accountId: string, userId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 50,
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    return account;
  }

  async updateAccount(accountId: string, userId: string, updateAccountDto: UpdateAccountDto) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const updated = await this.prisma.account.update({
      where: { id: accountId },
      data: updateAccountDto,
    });

    return updated;
  }

  async deleteAccount(accountId: string, userId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    await this.prisma.account.delete({
      where: { id: accountId },
    });

    return { message: 'Account deleted successfully' };
  }

  async updateAccountBalance(accountId: string, balance: number) {
    const updated = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        balance,
        lastSync: new Date(),
      },
    });

    return updated;
  }

  async getUserTotalNetWorth(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: { balance: true, currency: true },
    });

    const totalNetWorth = accounts.reduce((sum, account) => sum + account.balance, 0);

    return {
      totalNetWorth,
      accounts: accounts.length,
    };
  }
}
