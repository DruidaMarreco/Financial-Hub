# Financial Hub - API Documentation

Complete REST API reference for Financial Hub. All endpoints require authentication via JWT token (except `/auth` endpoints).

## Base URL

**Development**: `http://localhost:3001`  
**Production**: `https://your-domain.com/api`

## Authentication

All endpoints (except auth) require JWT token in the `Authorization` header:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/accounts
```

### Getting an Auth Token

#### Sign Up
```bash
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password_123",
  "name": "User Name",
  "confirmPassword": "secure_password_123"
}

Response: {
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "cuid...",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

#### Sign In
```bash
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "secure_password_123"
}

Response: {
  "accessToken": "eyJhbGc...",
  "user": { ... }
}
```

#### Get Current User
```bash
GET /auth/me
Authorization: Bearer YOUR_TOKEN

Response: {
  "id": "cuid...",
  "email": "user@example.com",
  "name": "User Name",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

---

## 💰 Accounts API

Manage financial accounts (checking, savings, credit cards, investments, crypto).

### List Accounts
```bash
GET /accounts
Authorization: Bearer TOKEN

Response: [
  {
    "id": "acc_123",
    "name": "Checking Account",
    "type": "bank",
    "balance": 5000,
    "currency": "EUR",
    "institution": "cgd",
    "status": "active",
    "lastSync": "2024-01-20T15:30:00Z",
    "createdAt": "2024-01-15T10:30:00Z"
  },
  ...
]
```

### Get Account Details
```bash
GET /accounts/:id
Authorization: Bearer TOKEN

Response: {
  "id": "acc_123",
  "name": "Checking Account",
  "type": "bank",
  "balance": 5000,
  "currency": "EUR",
  "institution": "cgd",
  "status": "active",
  "lastSync": "2024-01-20T15:30:00Z",
  "transactions": [
    {
      "id": "tx_123",
      "date": "2024-01-20T12:00:00Z",
      "description": "Continente Hipermercados",
      "amount": -45.50,
      "category": "groceries",
      "merchant": "Continente"
    },
    ...
  ]
}
```

### Create Account
```bash
POST /accounts
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "My Savings",
  "accountNumber": "PT50123456789012345678901",
  "type": "savings",
  "currency": "EUR",
  "institution": "cgd"
}

Response: {
  "id": "acc_456",
  "name": "My Savings",
  "type": "savings",
  "balance": 0,
  "currency": "EUR",
  ...
}
```

### Update Account
```bash
PUT /accounts/:id
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "active"
}

Response: { ... }
```

### Delete Account
```bash
DELETE /accounts/:id
Authorization: Bearer TOKEN

Response: { "success": true }
```

### Get Net Worth
```bash
GET /accounts/metrics/networth
Authorization: Bearer TOKEN

Response: {
  "totalBalance": 45000,
  "currency": "EUR",
  "byType": {
    "bank": 5000,
    "savings": 15000,
    "investment": 25000,
    "credit_card": -500
  }
}
```

---

## 🏦 Plaid Integration API

Connect bank accounts via Plaid.

### Get Plaid Link Token
```bash
POST /plaid/link-token
Authorization: Bearer TOKEN

Response: {
  "linkToken": "link-prod-123...",
  "expiration": "2024-02-20T12:00:00Z"
}
```

### Exchange Plaid Token
```bash
POST /plaid/exchange-token
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "publicToken": "public-prod-123..."
}

Response: {
  "success": true,
  "accountsLinked": 2,
  "accounts": [
    {
      "id": "acc_123",
      "name": "Checking",
      "balance": 5000,
      "institution": "bank_name"
    }
  ]
}
```

---

## 📊 Transactions API

Browse and manage transactions.

### List Transactions
```bash
GET /transactions?accountId=acc_123&startDate=2024-01-01&endDate=2024-01-31&category=groceries
Authorization: Bearer TOKEN

Query Parameters:
- accountId (optional): Filter by account
- startDate (optional): ISO date string
- endDate (optional): ISO date string
- category (optional): Transaction category
- minAmount (optional): Minimum amount
- maxAmount (optional): Maximum amount
- search (optional): Search in description/merchant

Response: [
  {
    "id": "tx_123",
    "accountId": "acc_123",
    "date": "2024-01-20T12:00:00Z",
    "description": "Continente Hipermercados",
    "amount": -45.50,
    "category": "groceries",
    "categoryConfidence": 0.95,
    "merchant": "Continente",
    "tags": ["grocery", "weekly"],
    "anomalyScore": 0.1,
    "isAnomaly": false
  },
  ...
]
```

### Get Transaction Details
```bash
GET /transactions/:id
Authorization: Bearer TOKEN

Response: { ... same as above ... }
```

### Categorize Transaction
```bash
PUT /transactions/:id/categorize
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "category": "dining"
}

Response: { ... updated transaction ... }
```

### Bulk Categorize
```bash
POST /transactions/bulk/categorize
Authorization: Bearer TOKEN

Response: {
  "categorized": 15,
  "skipped": 2,
  "results": [ ... ]
}
```

### Get Transaction Statistics
```bash
GET /transactions/stats?period=month
Authorization: Bearer TOKEN

Query Parameters:
- period: "month" or "year" (default: "month")

Response: {
  "totalIncome": 3500,
  "totalExpense": 1200,
  "byCategory": {
    "groceries": 320,
    "dining": 180,
    "transport": 150,
    ...
  },
  "avgTransaction": 45.50,
  "largestTransaction": 450
}
```

### Sync Transactions from Plaid
```bash
POST /transactions/sync/:accountId
Authorization: Bearer TOKEN

Response: {
  "synced": 42,
  "skipped": 3,
  "newBalance": 5000,
  "lastSync": "2024-01-20T15:30:00Z"
}
```

---

## 📈 Analytics API

Financial analytics and insights.

### Get Net Worth History
```bash
GET /analytics/networth
Authorization: Bearer TOKEN

Response: {
  "current": 45000,
  "change": 1500,
  "changePercent": 3.45,
  "history": [
    { "date": "2024-01-20", "value": 45000 },
    { "date": "2024-01-19", "value": 43500 },
    ...
  ]
}
```

### Get Cash Flow
```bash
GET /analytics/cashflow?period=month
Authorization: Bearer TOKEN

Query Parameters:
- period: "month", "quarter", or "year"

Response: {
  "income": 3500,
  "expense": 1200,
  "net": 2300,
  "byMonth": [ ... ]
}
```

### Get Spending Heatmap
```bash
GET /analytics/heatmap?category=groceries
Authorization: Bearer TOKEN

Response: {
  "category": "groceries",
  "byDay": {
    "Monday": 150,
    "Tuesday": 200,
    ...
  },
  "byHour": [ ... ],
  "totalSpent": 1200
}
```

### Get Financial Forecast
```bash
GET /analytics/forecast?months=12
Authorization: Bearer TOKEN

Query Parameters:
- months: Number of months to forecast (1-24)

Response: {
  "forecast": [
    { "month": "2024-02", "balance": 46000, "confidence": 0.85 },
    { "month": "2024-03", "balance": 48000, "confidence": 0.75 },
    ...
  ]
}
```

### Get Financial Goals
```bash
GET /analytics/goals
Authorization: Bearer TOKEN

Response: [
  {
    "id": "goal_123",
    "name": "Save €10,000",
    "targetAmount": 10000,
    "currentAmount": 6000,
    "deadline": "2024-12-31",
    "progress": 60
  },
  ...
]
```

### Get Investment Performance
```bash
GET /analytics/investments
Authorization: Bearer TOKEN

Response: {
  "totalInvested": 25000,
  "currentValue": 26150,
  "totalGain": 1150,
  "gainPercent": 4.6,
  "byAsset": [ ... ]
}
```

### Get Dashboard Data (Universe View)
```bash
GET /analytics/dashboard/universe
Authorization: Bearer TOKEN

Response: {
  "netWorth": 45000,
  "accounts": [ ... ],
  "recentTransactions": [ ... ],
  "portfolioValue": 26150,
  "monthlyIncome": 3500,
  "monthlyExpense": 1200
}
```

### Get Dashboard Data (FIRE/FI View)
```bash
GET /analytics/dashboard/freedom
Authorization: Bearer TOKEN

Response: {
  "fireNumber": 825000,  // Amount needed for retirement
  "currentNetWorth": 45000,
  "monthlyExpense": 1200,
  "yearsToFIRE": 18.5,
  "monthlyContribution": 2300
}
```

---

## 🪙 Integrations API

Multi-asset class integrations (crypto, stocks, real estate).

### Get Crypto Wallet
```bash
GET /integrations/crypto/wallet/:address
Authorization: Bearer TOKEN

Response: {
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f42bE...",
  "balance": 2.5,
  "value": 62500,
  "token": "ETH",
  "balanceHistory": [ ... ]
}
```

### Analyze Crypto Portfolio
```bash
POST /integrations/crypto/portfolio
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "holdings": [
    { "symbol": "ETH", "quantity": 2.5 },
    { "symbol": "BTC", "quantity": 0.1 }
  ]
}

Response: {
  "totalValue": 62500,
  "byAsset": [ ... ],
  "diversification": "Good"
}
```

### Get Crypto Price
```bash
GET /integrations/crypto/price/:id
Authorization: Bearer TOKEN

Query Parameters:
- id: Crypto ID (e.g., "ethereum", "bitcoin")

Response: {
  "id": "ethereum",
  "symbol": "ETH",
  "price": 2500,
  "change24h": 5.2,
  "change7d": -3.1
}
```

### Get Stock Price
```bash
GET /integrations/stocks/price/:symbol
Authorization: Bearer TOKEN

Response: {
  "symbol": "AAPL",
  "price": 180,
  "change": 2.5,
  "marketCap": 2.8e12
}
```

### Get Stock Fundamentals
```bash
GET /integrations/stocks/fundamentals/:symbol
Authorization: Bearer TOKEN

Response: {
  "symbol": "AAPL",
  "pe": 28.5,
  "eps": 6.3,
  "dividend": 0.92,
  "beta": 1.2,
  "marketCap": 2.8e12
}
```

### Estimate Real Estate Value
```bash
POST /integrations/realestate/estimate
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "address": "123 Main St, Lisbon",
  "bedrooms": 3,
  "bathrooms": 2,
  "squareMeters": 150
}

Response: {
  "estimatedValue": 450000,
  "confidence": 0.82,
  "comparables": [ ... ]
}
```

### Calculate Mortgage
```bash
POST /integrations/realestate/mortgage-calculator
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "propertyValue": 450000,
  "downPayment": 90000,
  "interestRate": 3.5,
  "yearsToRepay": 30
}

Response: {
  "monthlyPayment": 1512,
  "totalPayment": 544320,
  "totalInterest": 94320,
  "schedule": [ ... ]
}
```

---

## ⚡ ML Intelligence API

AI/ML powered financial insights.

### Get Transaction Categorization
Handled automatically on transaction creation and via `/transactions/bulk/categorize`

### Get Anomaly Detection
Automatic on each transaction (see `isAnomaly` and `anomalyScore` fields)

### Get Portfolio Recommendations
```bash
GET /integrations/allocation/recommend/:age/:riskTolerance
Authorization: Bearer TOKEN

Path Parameters:
- age: Your age (25-80)
- riskTolerance: "conservative", "moderate", or "aggressive"

Response: {
  "allocation": {
    "stocks": 60,
    "bonds": 30,
    "alternatives": 10
  },
  "reasoning": "..."
}
```

### Analyze Portfolio Allocation
```bash
POST /integrations/allocation/analyze
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "holdings": [
    { "symbol": "AAPL", "value": 10000 },
    { "symbol": "MSFT", "value": 8000 },
    ...
  ]
}

Response: {
  "allocation": { ... },
  "riskProfile": "moderate",
  "recommendations": [ ... ]
}
```

---

## ❌ Error Handling

All endpoints return standardized error responses:

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "error": "Detailed error message"
}
```

### Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (invalid input) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (don't have access) |
| 404 | Not Found |
| 500 | Server Error |

---

## 🔑 Rate Limiting

Rate limiting is currently not enforced but is planned for production. See CLAUDE.md for notes.

---

## 📝 Request/Response Examples

### Complete Sign Up Flow
```bash
# 1. Sign up
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "secure123456",
    "confirmPassword": "secure123456",
    "name": "New User"
  }'

# Response:
{
  "accessToken": "eyJhbGc...",
  "user": {
    "id": "cuid123...",
    "email": "newuser@example.com",
    "name": "New User"
  }
}

# 2. Create account
TOKEN="eyJhbGc..."
curl -X POST http://localhost:3001/accounts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Bank",
    "accountNumber": "PT50123...",
    "type": "bank",
    "currency": "EUR",
    "institution": "cgd"
  }'

# 3. List accounts
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/accounts
```

---

## 🧪 Testing with cURL

```bash
# Get token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@financialhub.io","password":"demo123456"}' \
  | jq -r '.accessToken')

# Use token
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/accounts | jq
```

---

## 🚀 SDK/Client Libraries

Official client libraries coming soon for:
- JavaScript/TypeScript
- Python
- Java

For now, use REST with your favorite HTTP client (curl, Axios, Fetch, etc.)

---

**API Version**: 1.0  
**Last Updated**: 2026-06-09

