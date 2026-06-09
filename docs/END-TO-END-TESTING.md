# End-to-End Testing Guide

This guide explains how to test the complete Financial Hub system with real database and API integration.

## 🎯 Prerequisites

- ✅ Database set up and running (`npm run db:migrate`)
- ✅ Demo data seeded (`npm run db:seed`)
- ✅ Both API and Web servers running (`npm run dev`)

## 🚀 Quick Start Test

### 1. Verify Database is Working

```bash
# Open Prisma Studio to view database
npm run db:studio
```

You should see:
- ✅ 1 demo user (demo@financialhub.io)
- ✅ 4 accounts with €45,000 balance
- ✅ 30 transactions
- ✅ 9 categories
- ✅ 1 portfolio with holdings

### 2. Test API Directly

```bash
# Sign in and get JWT token
curl -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@financialhub.io",
    "password": "demo123456"
  }' | jq '.accessToken'

# Save the token (without quotes)
TOKEN="eyJhbGc..."

# Test getting accounts
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/accounts | jq

# Test getting transactions
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/transactions | jq

# Test getting net worth
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/accounts/metrics/networth | jq
```

### 3. Test Frontend with Real API

#### Option A: Using Real API (Recommended)

1. Make sure `.env` doesn't have `NEXT_PUBLIC_DEV_MODE=true`
2. Open http://localhost:3000
3. Sign in with demo credentials:
   - Email: `demo@financialhub.io`
   - Password: `demo123456`

You should see:
- ✅ Dashboard with real account data
- ✅ €45,000 net worth
- ✅ Real transactions listed
- ✅ Account balances loaded from database

#### Option B: Using Dev Mode (Mock Data)

If you want to test with mock data:

1. Add to `.env`:
   ```env
   NEXT_PUBLIC_DEV_MODE=true
   ```

2. Restart web server (`npm run dev`)
3. Open http://localhost:3000
4. Click "Use Demo Mode" button on signin
5. Mock data loads from localStorage

## 📊 Complete Test Checklist

### Authentication Flow

- [ ] Sign up creates user in database
  ```bash
  curl -X POST http://localhost:3001/auth/signup \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "name": "Test User",
      "password": "testpass123",
      "confirmPassword": "testpass123"
    }'
  ```

- [ ] Sign in returns valid JWT token
  ```bash
  curl -X POST http://localhost:3001/auth/signin \
    -H "Content-Type: application/json" \
    -d '{"email": "test@example.com", "password": "testpass123"}'
  ```

- [ ] /auth/me returns current user
  ```bash
  curl -H "Authorization: Bearer TOKEN" \
    http://localhost:3001/auth/me
  ```

- [ ] Invalid token returns 401 error
  ```bash
  curl -H "Authorization: Bearer invalid-token" \
    http://localhost:3001/accounts
  ```

### Accounts API

- [ ] GET /accounts returns list of accounts
  ```bash
  curl -H "Authorization: Bearer TOKEN" \
    http://localhost:3001/accounts | jq '.[] | {name, balance, type}'
  ```

- [ ] GET /accounts/:id returns account with transactions
  ```bash
  curl -H "Authorization: Bearer TOKEN" \
    http://localhost:3001/accounts/ACCOUNT_ID | jq '.transactions | length'
  ```

- [ ] POST /accounts creates new account
  ```bash
  curl -X POST http://localhost:3001/accounts \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "New Account",
      "accountNumber": "PT50999...",
      "type": "savings",
      "currency": "EUR",
      "institution": "cgd"
    }'
  ```

- [ ] PUT /accounts/:id updates account
  ```bash
  curl -X PUT http://localhost:3001/accounts/ACCOUNT_ID \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name": "Updated Name"}'
  ```

- [ ] DELETE /accounts/:id removes account
  ```bash
  curl -X DELETE http://localhost:3001/accounts/ACCOUNT_ID \
    -H "Authorization: Bearer TOKEN"
  ```

- [ ] GET /accounts/metrics/networth returns aggregated data
  ```bash
  curl -H "Authorization: Bearer TOKEN" \
    http://localhost:3001/accounts/metrics/networth | jq '{totalBalance, byType}'
  ```

### Transactions API

- [ ] GET /transactions returns all transactions
  ```bash
  curl -H "Authorization: Bearer TOKEN" \
    http://localhost:3001/transactions | jq 'length'
  ```

- [ ] GET /transactions with filters works
  ```bash
  curl -H "Authorization: Bearer TOKEN" \
    "http://localhost:3001/transactions?category=groceries" | jq
  ```

- [ ] GET /transactions/stats returns spending analysis
  ```bash
  curl -H "Authorization: Bearer TOKEN" \
    http://localhost:3001/transactions/stats | jq '{totalIncome, totalExpense}'
  ```

- [ ] PUT /transactions/:id/categorize updates category
  ```bash
  curl -X PUT http://localhost:3001/transactions/TX_ID/categorize \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"category": "dining"}'
  ```

- [ ] POST /transactions/bulk/categorize auto-categorizes all
  ```bash
  curl -X POST http://localhost:3001/transactions/bulk/categorize \
    -H "Authorization: Bearer TOKEN" \
    -H "Content-Type: application/json" | jq
  ```

### Frontend Pages

- [ ] Dashboard loads with real data
  - [ ] Net worth shows €45,000
  - [ ] Recent transactions visible
  - [ ] Account balances display correctly

- [ ] Accounts page shows all accounts
  - [ ] Can view account details
  - [ ] Can create new account
  - [ ] Can edit existing account
  - [ ] Can delete account

- [ ] Transactions page shows transactions
  - [ ] Can filter by date, category, amount
  - [ ] Can categorize transaction
  - [ ] Can search transactions

- [ ] Analytics page shows correct data
  - [ ] Spending by category chart
  - [ ] Net worth trend
  - [ ] Income vs expenses

- [ ] Portfolio page displays holdings
  - [ ] Lists all holdings
  - [ ] Shows gains/losses
  - [ ] Portfolio metrics correct

## 🔧 Troubleshooting

### "Cannot GET /accounts" or API calls fail

**Problem**: Frontend not connecting to API

**Solution**:
1. Check API is running: `npm run dev` (should show both servers)
2. Check `NEXT_PUBLIC_API_URL` in `.env` or browser dev tools
3. Verify auth token is being sent: Check Network tab in browser DevTools
4. Restart both servers

### "Invalid token" or 401 errors

**Problem**: Authentication not working

**Solution**:
1. Clear browser storage: `localStorage.clear()` in console
2. Sign in again to get fresh token
3. Check token in Network tab (Authorization header)
4. Check token hasn't expired (JWT exp claim)

### Database shows data but frontend shows nothing

**Problem**: Frontend using mock data instead of real API

**Solution**:
1. Check `.env` doesn't have `NEXT_PUBLIC_DEV_MODE=true`
2. Check browser console for errors
3. Check Network tab for API calls (should see requests to :3001)
4. Clear localStorage: `localStorage.clear()` in console
5. Restart web server

### Transactions not syncing from Plaid

**Problem**: Plaid integration credentials missing

**Solution**:
1. Get credentials from https://dashboard.plaid.com
2. Add to `.env`:
   ```env
   PLAID_CLIENT_ID=your_client_id
   PLAID_SECRET=your_secret
   PLAID_ENV=sandbox
   ```
3. Restart API server
4. Try linking account in app

## 🧪 Load Testing

### Test with multiple accounts

```bash
TOKEN="your_token"

# Create 5 test accounts
for i in {1..5}; do
  curl -X POST http://localhost:3001/accounts \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"name\": \"Test Account $i\",
      \"accountNumber\": \"PT50000000000000000000$i\",
      \"type\": \"checking\",
      \"currency\": \"EUR\",
      \"institution\": \"cgd\"
    }"
done

# List all accounts (should be 9 total)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/accounts | jq 'length'
```

### Test with many transactions

The demo seed creates 30 transactions. You can:
1. Create transactions via UI
2. Manually insert via Prisma Studio
3. Sync from Plaid API
4. Use test data generator script (TBD)

## 📈 Performance Testing

### API Response Times

```bash
TOKEN="your_token"

# Test GET /accounts (should be < 100ms)
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/accounts > /dev/null

# Test GET /transactions (should be < 200ms with 30 txns)
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/transactions > /dev/null

# Test /auth/me (should be < 50ms)
time curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/auth/me > /dev/null
```

### Frontend Load Time

1. Open DevTools (F12)
2. Go to Network tab
3. Hard refresh (Ctrl+Shift+R)
4. Check:
   - Page load time (target: < 3s)
   - API call times (target: < 500ms each)
   - Bundle sizes (target: < 200KB)

## ✅ Verification Checklist

After running all tests:

- [ ] All API endpoints respond with correct data
- [ ] Authentication works with real users
- [ ] Frontend displays real data from database
- [ ] No console errors on frontend
- [ ] No 401/403 errors
- [ ] Create/update/delete operations work
- [ ] Filtering and searching works
- [ ] Page load times acceptable
- [ ] Data persists after refresh
- [ ] Dev mode toggle works

## 🎓 Next Steps

Once all tests pass:

1. **Integration Testing**: Test with real bank credentials (Plaid, Revolut, etc.)
2. **Load Testing**: Test with 1000+ transactions
3. **Staging Deployment**: Deploy to staging environment
4. **User Testing**: Have real users test workflows
5. **Production Deployment**: Release to production

## 📝 Reporting Issues

If tests fail, collect:

1. **Error message** (full text)
2. **Browser console errors** (F12 → Console)
3. **API response** (Network tab → Response)
4. **Steps to reproduce** (clear instructions)
5. **Environment** (OS, Node version, browser)

Then file a GitHub issue with this information.

---

**Test Version**: 1.0  
**Last Updated**: 2026-06-09  
**Status**: Ready for testing

