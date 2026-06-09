# Demo Data & Database Seeding

This guide explains how to populate your Financial Hub database with demo data for testing and development.

## Quick Start

After setting up your database (see [DATABASE_SETUP.md](./DATABASE_SETUP.md)), seed it with demo data:

```bash
# Run the seed script
npm run db:seed

# Or manually with Prisma
npx prisma db seed --schema=libs/data/prisma/schema.prisma
```

That's it! Your database is now populated with:
- 1 demo user account
- 4 demo financial accounts (checking, savings, credit card, investment)
- 30 demo transactions with realistic data
- 9 transaction categories
- 1 demo investment portfolio with 3 holdings
- 30 days of balance history

## Demo User Credentials

**Email**: `demo@financialhub.io`  
**Password**: `demo123456`

## Demo Data Details

### Accounts
| Name | Type | Balance | Institution |
|------|------|---------|-------------|
| Checking Account | Bank | €5,000 | CGD |
| Savings Account | Savings | €15,000 | CGD |
| Credit Card | Credit Card | -€500 | Revolut |
| Investment Account | Investment | €25,000 | Other |

### Transactions
- **30 sample transactions** covering:
  - Groceries (Continente, Pingo Doce)
  - Dining (Starbucks)
  - Transport (Uber)
  - Entertainment (Netflix, Futebol Clube)
  - Shopping (ZARA)
  - Utilities (EDP)
  - Healthcare (Pharmacopia)
  - Income (Employer Salary: €3,500)

### Portfolio
| Holding | Quantity | Purchase Price | Current Price | Gain |
|---------|----------|----------------|---------------|------|
| Apple (AAPL) | 10 | €150 | €180 | +€300 |
| Microsoft (MSFT) | 8 | €300 | €380 | +€640 |
| Vanguard All-World | 25 | €88 | €95 | +€175 |

**Total Portfolio Value**: €25,115 EUR (+€1,115 gain)

### Categories
- 🛒 Groceries
- 🍽️ Dining
- 🚌 Transport
- 🎬 Entertainment
- 🛍️ Shopping
- 💡 Utilities
- 💊 Healthcare
- 💰 Income
- 💾 Savings

## Seed Script Details

The seed script (`libs/data/prisma/seed.ts`) performs the following:

1. **Clears existing data** (WARNING: Deletes all records)
2. **Creates a demo user** with bcrypt-hashed password
3. **Creates user profile** with EUR currency and Europe/Lisbon timezone
4. **Creates 4 financial accounts** with realistic IBAN/card numbers
5. **Creates transaction categories** with colors and icons
6. **Creates 30 transactions** with realistic merchants and amounts
7. **Creates an investment portfolio** with 3 holdings
8. **Creates portfolio metrics** with gain/loss calculations
9. **Creates 30 days of balance history** for charting

## Customizing Demo Data

To customize the demo data, edit `libs/data/prisma/seed.ts`:

### Change demo user credentials
```typescript
const user = await prisma.user.create({
  data: {
    email: 'your-email@example.com',  // Change this
    name: 'Your Name',                 // And this
    password: hashedPassword,
  },
});
```

### Add more transactions
```typescript
const merchants = [
  { name: 'Your Store', category: 'Groceries', amount: 100 },
  // Add more merchants here
];
```

### Change account balances
```typescript
const account1 = await prisma.account.create({
  data: {
    // ...
    balance: 10000,  // Change this
    // ...
  },
});
```

## Running Seed Manually

If you need to re-seed or customize, you can run the seed directly:

```bash
# Using ts-node
cd libs/data
npm run db:seed

# Or from root
npm run db:seed --workspace=@financial-hub/data
```

## Database State After Seeding

After running the seed script, you can verify the data:

### Option 1: Using Prisma Studio
```bash
npm run db:studio
```
This opens an interactive database viewer at `http://localhost:5555`

### Option 2: Using psql (PostgreSQL CLI)
```bash
psql -U postgres -d financial_hub

-- Count records
SELECT COUNT(*) as users FROM users;
SELECT COUNT(*) as accounts FROM accounts;
SELECT COUNT(*) as transactions FROM transactions;
```

### Option 3: Using the API
```bash
# Sign in first
curl -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@financialhub.io",
    "password": "demo123456"
  }'

# Then fetch accounts
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/accounts
```

## Resetting the Database

To completely reset and re-seed:

```bash
# This deletes all data and re-runs migrations
npm run db:migrate:reset

# Then seed with demo data
npm run db:seed
```

⚠️ **WARNING**: This is destructive and cannot be undone. Only use in development!

## Production Considerations

**IMPORTANT**: The seed script should NOT be used in production:

1. It clears all existing data
2. It creates hardcoded demo user credentials
3. It uses predictable test data

For production, you'll want to:
1. Use proper user registration flows
2. Implement data import tools for real financial data
3. Create a proper backup/restore process
4. Never run seeders on production databases

To disable auto-seeding in production, remove the `prisma` section from your `package.json` or modify your deployment scripts to skip seeding.

## Troubleshooting

### "ts-node command not found"
```bash
npm install ts-node typescript --save-dev
```

### "bcrypt not installed"
```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

### "Connection refused"
Make sure PostgreSQL is running:
```bash
docker-compose ps  # Check if container is running
```

### "Database not created"
Run migrations first:
```bash
npm run db:migrate
```

### Seed runs but no data appears
Check that migrations have been applied:
```bash
npm run db:studio  # View the schema
```

## Next Steps

After seeding:

1. **Start the dev servers**:
   ```bash
   npm run dev
   ```

2. **Log in** with demo credentials:
   - Email: `demo@financialhub.io`
   - Password: `demo123456`

3. **Explore the dashboard** to see all demo data

4. **Test features**:
   - View accounts and balances
   - Browse transactions
   - Check portfolio performance
   - Create new transactions
   - Categorize transactions

## Related Documentation

- [DATABASE_SETUP.md](./DATABASE_SETUP.md) - Database configuration
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [TESTING.md](./TESTING.md) - Testing guide
