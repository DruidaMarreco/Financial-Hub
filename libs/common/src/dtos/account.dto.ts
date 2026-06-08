export interface CreateAccountDto {
  name: string;
  accountNumber: string;
  type: string;
  currency: string;
  institution: string;
}

export interface UpdateAccountDto {
  name?: string;
  currency?: string;
  status?: string;
}

export interface PlaidLinkTokenDto {
  linkToken: string;
  expiration: string;
  requestId: string;
}

export interface PlaidExchangeDto {
  publicToken: string;
  metadata: {
    accounts: Array<{
      id: string;
      name: string;
      type: string;
      subtype: string;
    }>;
  };
}

export interface AccountResponseDto {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  institution: string;
  status: string;
  lastSync?: Date;
}
