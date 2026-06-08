import { TransactionCategorizer } from './transaction-categorizer';

describe('TransactionCategorizer', () => {
  let categorizer: TransactionCategorizer;

  beforeEach(() => {
    categorizer = new TransactionCategorizer();
  });

  describe('predict', () => {
    it('should categorize grocery store transaction', () => {
      const result = categorizer.predict({
        merchant: 'Whole Foods Market',
        amount: 85.32,
        category: '',
      });

      expect(result.category).toBe('Groceries');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should categorize restaurant transaction', () => {
      const result = categorizer.predict({
        merchant: 'McDonald\'s',
        amount: 15.99,
        category: '',
      });

      expect(result.category).toBe('Dining');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should categorize coffee shop transaction', () => {
      const result = categorizer.predict({
        merchant: 'Starbucks Coffee',
        amount: 5.50,
        category: '',
      });

      expect(result.category).toBe('Coffee');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should categorize transportation transaction', () => {
      const result = categorizer.predict({
        merchant: 'Uber',
        amount: 25.00,
        category: '',
      });

      expect(result.category).toBe('Transportation');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should categorize utility payment', () => {
      const result = categorizer.predict({
        merchant: 'Electric Company',
        amount: 150.00,
        category: '',
      });

      expect(result.category).toBe('Utilities');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should default to Other for unknown merchant', () => {
      const result = categorizer.predict({
        merchant: 'Unknown Store XYZ',
        amount: 50.00,
        category: '',
      });

      expect(result.category).toBe('Other');
      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should return confidence score between 0 and 1', () => {
      const result = categorizer.predict({
        merchant: 'Amazon',
        amount: 100.00,
        category: '',
      });

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('logCorrection', () => {
    it('should log correction for future training', () => {
      const merchant = 'NewStore';
      const correctCategory = 'Shopping';

      categorizer.logCorrection(merchant, correctCategory);

      // Verify next prediction uses the correction
      const result = categorizer.predict({
        merchant,
        amount: 50.00,
        category: '',
      });

      expect(result.category).toBe(correctCategory);
    });

    it('should improve confidence after correction', () => {
      const merchant = 'TestMerchant';
      const category = 'Shopping';

      // First prediction (should be low confidence)
      const before = categorizer.predict({
        merchant,
        amount: 50.00,
        category: '',
      });

      // Log correction
      categorizer.logCorrection(merchant, category);

      // Second prediction (should be higher confidence)
      const after = categorizer.predict({
        merchant,
        amount: 50.00,
        category: '',
      });

      expect(after.confidence).toBeGreaterThanOrEqual(before.confidence);
    });
  });

  describe('edge cases', () => {
    it('should handle empty merchant name', () => {
      const result = categorizer.predict({
        merchant: '',
        amount: 50.00,
        category: '',
      });

      expect(result).toHaveProperty('category');
      expect(result).toHaveProperty('confidence');
    });

    it('should handle very large amounts', () => {
      const result = categorizer.predict({
        merchant: 'Amazon',
        amount: 999999.99,
        category: '',
      });

      expect(result).toHaveProperty('category');
    });

    it('should handle zero amount', () => {
      const result = categorizer.predict({
        merchant: 'Test',
        amount: 0,
        category: '',
      });

      expect(result).toHaveProperty('category');
    });

    it('should be case-insensitive', () => {
      const result1 = categorizer.predict({
        merchant: 'STARBUCKS',
        amount: 5.50,
        category: '',
      });

      const result2 = categorizer.predict({
        merchant: 'starbucks',
        amount: 5.50,
        category: '',
      });

      expect(result1.category).toBe(result2.category);
    });
  });
});
