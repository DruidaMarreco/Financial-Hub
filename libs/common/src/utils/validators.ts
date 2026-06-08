export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidCurrency(currency: string): boolean {
  const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
  return validCurrencies.includes(currency.toUpperCase());
}

export function isValidAmount(amount: number): boolean {
  return typeof amount === 'number' && amount >= 0 && isFinite(amount);
}

export function isValidAccountType(type: string): boolean {
  const validTypes = ['bank', 'credit_card', 'investment', 'crypto', 'savings'];
  return validTypes.includes(type.toLowerCase());
}
