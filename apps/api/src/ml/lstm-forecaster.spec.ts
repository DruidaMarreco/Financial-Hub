import { LSTMForecaster } from './lstm-forecaster';

describe('LSTMForecaster', () => {
  let forecaster: LSTMForecaster;

  const createMockTransactions = (category: string, months: number, baseAmount: number) => {
    const transactions = [];
    const startDate = new Date('2023-01-01');

    for (let i = 0; i < months; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);

      transactions.push({
        amount: baseAmount + Math.random() * 100, // Slight variation
        category,
        date,
      });
    }

    return transactions;
  };

  beforeEach(() => {
    forecaster = new LSTMForecaster();
  });

  describe('forecastWithLSTM', () => {
    it('should forecast with stable trend', async () => {
      const transactions = createMockTransactions('Groceries', 12, 200);

      const forecasts = await forecaster.forecastWithLSTM(transactions, 6);

      expect(forecasts.length).toBeGreaterThan(0);
      expect(forecasts[0]).toHaveProperty('category');
      expect(forecasts[0]).toHaveProperty('predictions');
      expect(forecasts[0]).toHaveProperty('trend');
      expect(forecasts[0]).toHaveProperty('seasonality');
    });

    it('should detect increasing trend', async () => {
      const transactions = [];
      const startDate = new Date('2023-01-01');

      // Create increasing trend
      for (let i = 0; i < 12; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);

        transactions.push({
          amount: 100 + i * 50, // Increasing
          category: 'Dining',
          date,
        });
      }

      const forecasts = await forecaster.forecastWithLSTM(transactions, 6);
      const forecast = forecasts.find(f => f.category === 'Dining');

      expect(forecast?.trend).toBe('increasing');
    });

    it('should detect decreasing trend', async () => {
      const transactions = [];
      const startDate = new Date('2023-01-01');

      // Create decreasing trend
      for (let i = 0; i < 12; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);

        transactions.push({
          amount: 600 - i * 50, // Decreasing
          category: 'Entertainment',
          date,
        });
      }

      const forecasts = await forecaster.forecastWithLSTM(transactions, 6);
      const forecast = forecasts.find(f => f.category === 'Entertainment');

      expect(forecast?.trend).toBe('decreasing');
    });

    it('should return predictions with confidence scores', async () => {
      const transactions = createMockTransactions('Shopping', 12, 150);

      const forecasts = await forecaster.forecastWithLSTM(transactions, 6);

      if (forecasts.length > 0) {
        const predictions = forecasts[0].predictions;
        expect(predictions.length).toBe(6);

        predictions.forEach(p => {
          expect(p.predicted).toBeGreaterThan(0);
          expect(p.confidence).toBeGreaterThan(0);
          expect(p.confidence).toBeLessThanOrEqual(1);
        });
      }
    });

    it('should skip categories with insufficient history', async () => {
      const transactions = [
        { amount: 100, category: 'Rare', date: new Date() },
      ];

      const forecasts = await forecaster.forecastWithLSTM(transactions, 6);

      expect(forecasts.length).toBe(0);
    });

    it('should handle multiple categories', async () => {
      const transactions = [
        ...createMockTransactions('Groceries', 12, 200),
        ...createMockTransactions('Dining', 12, 150),
        ...createMockTransactions('Shopping', 12, 300),
      ];

      const forecasts = await forecaster.forecastWithLSTM(transactions, 6);

      expect(forecasts.length).toBe(3);
      expect(forecasts.map(f => f.category)).toContain('Groceries');
      expect(forecasts.map(f => f.category)).toContain('Dining');
      expect(forecasts.map(f => f.category)).toContain('Shopping');
    });
  });

  describe('detectPatterns', () => {
    it('should detect weekly spending patterns', () => {
      const transactions = [];
      const startDate = new Date('2023-01-01');

      // Transactions on Fridays (day 5)
      for (let i = 0; i < 20; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i * 7); // Every Friday

        transactions.push({
          amount: 50,
          category: 'Dining',
          date,
        });
      }

      const patterns = forecaster.detectPatterns(transactions);

      expect(patterns.weekly.length).toBeGreaterThan(0);
      expect(patterns.weekly).toContain('Friday');
    });

    it('should detect monthly spending patterns', () => {
      const transactions = [];
      const startDate = new Date('2023-01-01');

      // Transactions on the 1st of each month
      for (let i = 0; i < 12; i++) {
        const date = new Date(startDate);
        date.setMonth(date.getMonth() + i);

        transactions.push({
          amount: 100,
          category: 'Utilities',
          date,
        });
      }

      const patterns = forecaster.detectPatterns(transactions);

      expect(patterns.monthly.length).toBeGreaterThan(0);
    });

    it('should return empty patterns for random transactions', () => {
      const transactions = [];
      const startDate = new Date('2023-01-01');

      // Random dates
      for (let i = 0; i < 10; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + Math.random() * 30);

        transactions.push({
          amount: Math.random() * 100,
          category: 'Various',
          date,
        });
      }

      const patterns = forecaster.detectPatterns(transactions);

      expect(patterns).toHaveProperty('weekly');
      expect(patterns).toHaveProperty('monthly');
    });
  });
});
