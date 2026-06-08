import { Injectable } from '@nestjs/common';

@Injectable()
export class NLPProcessor {
  private merchantMap = new Map<string, string>();

  constructor() {
    this.initializeMerchantDatabase();
  }

  private initializeMerchantDatabase() {
    // Normalization database
    const mappings = {
      'STARBUCKS': ['STARBUCKS', 'SBUX', 'STARBKS'],
      'MCDONALDS': ['MCDONALDS', 'MCDS', 'MCDONALD'],
      'WHOLE FOODS': ['WHOLE FOODS', 'WHOLEFOODS', 'WF'],
      'AMAZON': ['AMAZON', 'AMZN', 'AMAZON.COM'],
    };

    for (const [canonical, variants] of Object.entries(mappings)) {
      for (const variant of variants) {
        this.merchantMap.set(variant.toUpperCase(), canonical);
      }
    }
  }

  normalizeMerchant(text: string): string {
    const upper = text.toUpperCase().trim();

    // Direct match
    if (this.merchantMap.has(upper)) {
      return this.merchantMap.get(upper)!;
    }

    // Fuzzy matching
    let best = upper;
    let bestScore = 0;
    for (const [key, value] of this.merchantMap) {
      const score = this.levenshteinSimilarity(upper, key);
      if (score > bestScore && score > 0.7) {
        bestScore = score;
        best = value;
      }
    }

    return best;
  }

  detectMerchantIntent(text: string): string {
    const lower = text.toLowerCase();

    const patterns = {
      'dining': /restaurant|cafe|pizza|burger|sushi|dining|meal/i,
      'shopping': /shopping|store|mall|retail|amazon/i,
      'travel': /hotel|flight|airline|transit|uber|taxi/i,
      'entertainment': /movie|cinema|concert|game|entertainment/i,
      'health': /doctor|pharmacy|gym|health|fitness/i,
    };

    for (const [intent, pattern] of Object.entries(patterns)) {
      if (pattern.test(lower)) {
        return intent;
      }
    }

    return 'other';
  }

  private levenshteinSimilarity(a: string, b: string): number {
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix = Array(b.length + 1)
      .fill(0)
      .map(() => Array(a.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        );
      }
    }

    return matrix[b.length][a.length];
  }
}
