import { Injectable } from '@nestjs/common';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

interface Transaction {
  id?: string;
  description: string;
  merchant?: string;
  amount: number;
  category?: string;
}

interface CategorizationResult {
  category: string;
  confidence: number;
  rule?: string;
}

@Injectable()
export class TransactionCategorizer {
  private rules: Map<string, { pattern: RegExp; category: string }[]> = new Map();
  private categoryFrequency: Map<string, number> = new Map();
  private merchantCache: Map<string, string> = new Map();
  private correctionLog: string = join(process.cwd(), 'data', 'category_corrections.jsonl');

  constructor() {
    this.initializeRules();
    this.loadCorrectionLog();
  }

  private initializeRules() {
    // Rule-based categorization (quick baseline)
    const rulesData = {
      'Groceries': [
        /whole foods|trader joe|kroger|safeway|albertsons|walmart|target|grocery|supermarket/i,
      ],
      'Dining': [
        /restaurant|cafe|pizza|burger|sushi|steak|diner|bar|pub|bistro|grill|kitchen|tapas/i,
        /doordash|uber eats|grubhub|postmates|delivery/i,
      ],
      'Coffee': [
        /starbucks|coffee|espresso|brew|cafe latte/i,
      ],
      'Transportation': [
        /uber|lyft|taxi|gas station|shell|exxon|chevron|bp|parking|transit|metro|bus|train|airline/i,
      ],
      'Entertainment': [
        /cinema|movie|theater|netflix|hulu|spotify|gaming|steam|psn|xbox|concert|tickets|eventbrite/i,
      ],
      'Utilities': [
        /electric|water|gas|internet|phone|verizon|at&t|comcast|utility|power/i,
      ],
      'Health': [
        /pharmacy|cvs|walgreens|doctor|hospital|medical|clinic|dental|dentist|health|gym|fitness/i,
      ],
      'Shopping': [
        /amazon|ebay|mall|store|shop|clothing|apparel|fashion|retail/i,
      ],
      'Subscriptions': [
        /subscription|membership|premium|monthly fee|annual fee/i,
      ],
      'Travel': [
        /hotel|airbnb|booking|flight|airline|airport|resort|motel/i,
      ],
    };

    for (const [category, patterns] of Object.entries(rulesData)) {
      this.rules.set(category, patterns.map(pattern => ({
        pattern,
        category,
      })));
    }
  }

  private loadCorrectionLog() {
    // Load previously corrected transactions for future model training
    try {
      if (existsSync(this.correctionLog)) {
        const data = readFileSync(this.correctionLog, 'utf-8');
        const lines = data.split('\n').filter(l => l);
        for (const line of lines) {
          try {
            const { merchant, category } = JSON.parse(line);
            if (merchant && category) {
              this.merchantCache.set(merchant.toLowerCase(), category);
            }
          } catch (e) {
            // Skip malformed lines
          }
        }
      }
    } catch (error) {
      console.error('Failed to load correction log:', error);
    }
  }

  async predict(transaction: Transaction): Promise<CategorizationResult> {
    const merchant = transaction.merchant?.toLowerCase() || transaction.description.toLowerCase();

    // Check merchant cache first (learned from corrections)
    if (this.merchantCache.has(merchant)) {
      return {
        category: this.merchantCache.get(merchant)!,
        confidence: 0.95,
        rule: 'cached',
      };
    }

    // Apply rule-based categorization
    for (const [category, patterns] of this.rules) {
      for (const rule of patterns) {
        const description = `${transaction.description} ${merchant}`;
        if (rule.pattern.test(description)) {
          return {
            category,
            confidence: 0.85,
            rule: 'regex',
          };
        }
      }
    }

    // Default to uncategorized with low confidence
    return {
      category: 'Other',
      confidence: 0.3,
      rule: 'default',
    };
  }

  async logCorrection(transaction: Transaction, correctCategory: string) {
    // Log user corrections for offline retraining
    const merchant = transaction.merchant || transaction.description;

    // Update cache immediately
    this.merchantCache.set(merchant.toLowerCase(), correctCategory);

    // Append to correction log
    try {
      const correction = {
        merchant,
        category: correctCategory,
        timestamp: new Date().toISOString(),
      };

      const dir = join(process.cwd(), 'data');
      if (!existsSync(dir)) {
        // Create data directory if it doesn't exist
      }

      writeFileSync(this.correctionLog, JSON.stringify(correction) + '\n', { flag: 'a' });
    } catch (error) {
      console.error('Failed to log correction:', error);
    }
  }

  // Future: Train model on accumulated corrections (offline task)
  async trainModel() {
    // This would be called periodically to retrain on accumulated corrections
    // Using accumulated data in correctionLog
    console.log('Model training would process corrections log');
  }
}
