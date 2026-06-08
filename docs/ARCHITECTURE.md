# Financial Hub Architecture

## Overview

Financial Hub is a monorepo application designed to aggregate financial data from multiple sources and provide comprehensive financial management and analysis capabilities.

## Directory Structure

```
financial-hub/
├── apps/
│   ├── api/              # Backend REST API (NestJS)
│   │   ├── src/
│   │   │   ├── main.ts           # Application bootstrap
│   │   │   ├── app.module.ts     # Main NestJS module
│   │   │   ├── modules/          # Feature modules (auth, accounts, transactions)
│   │   │   ├── services/         # Business logic services
│   │   │   ├── controllers/      # API route handlers
│   │   │   ├── filters/          # Exception filters
│   │   │   └── middleware/       # Custom middleware
│   │   └── dist/                 # Compiled output
│   │
│   └── web/              # Frontend Web Application (Next.js)
│       ├── src/
│       │   ├── pages/            # Next.js pages/routes
│       │   ├── components/       # Reusable React components
│       │   ├── hooks/            # Custom React hooks
│       │   ├── services/         # API client services
│       │   ├── store/            # State management (Zustand)
│       │   ├── styles/           # Global styles
│       │   └── utils/            # Utility functions
│       └── .next/                # Next.js build output
│
├── libs/
│   ├── core/             # Domain models and business logic interfaces
│   │   ├── src/
│   │   │   ├── models/           # Domain entities (User, Account, Transaction, etc.)
│   │   │   ├── services/         # Service interfaces
│   │   │   └── types/            # Type definitions
│   │   └── dist/
│   │
│   ├── data/             # Data layer and database models
│   │   ├── src/
│   │   │   └── db/               # Database utilities
│   │   ├── prisma/
│   │   │   └── schema.prisma     # Prisma database schema
│   │   └── dist/
│   │
│   └── common/           # Shared utilities, types, and constants
│       ├── src/
│       │   ├── constants/        # Application constants
│       │   ├── dtos/             # Data Transfer Objects
│       │   ├── types/            # Shared type definitions
│       │   └── utils/            # Utility functions
│       └── dist/
│
└── docs/                 # Documentation
    ├── ARCHITECTURE.md           # This file
    ├── DEVELOPMENT.md            # Development guide
    └── API.md                    # API documentation
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: NestJS 10
- **Language**: TypeScript 5
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (Passport)
- **Validation**: class-validator, class-transformer

### Frontend
- **Framework**: Next.js 14
- **Language**: TypeScript 5
- **UI Framework**: React 18
- **Styling**: TailwindCSS 3
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Data Fetching**: SWR

### Development
- **Package Manager**: npm workspaces
- **Build Tool**: TypeScript compiler
- **Testing**: Jest
- **Linting**: ESLint

## Data Flow

### User Journey
1. User signs up/logs in via Web UI
2. Frontend sends credentials to API
3. API authenticates user and returns JWT token
4. Frontend stores token and uses for subsequent requests

### Account Aggregation Flow
1. User initiates Plaid connection from Web UI
2. Frontend requests Plaid link token from API
3. User authenticates with bank via Plaid UI
4. Plaid returns public token to frontend
5. Frontend exchanges public token for access token with API
6. API stores Plaid access token securely
7. API syncs accounts and transactions from Plaid
8. Frontend displays aggregated accounts

### Data Aggregation Pipeline
```
External Sources
    ├── Plaid API (Banks)
    ├── Yahoo Finance (Stocks)
    ├── Crypto APIs
    └── Manual CSV Imports
        ↓
    API Services
        ├── Data Aggregation Service
        ├── Validation & Normalization
        └── Database Storage
            ↓
        PostgreSQL Database
            ↓
    Frontend
        ├── Real-time Dashboard
        ├── Analytics & Insights
        └── Reporting
```

## Key Components

### API Modules (Planned)
- **Auth Module**: User authentication and authorization
- **Accounts Module**: Account management and aggregation
- **Transactions Module**: Transaction management and categorization
- **Portfolios Module**: Portfolio tracking and analysis
- **Data Aggregation Module**: Plaid integration and data sync
- **Analysis Module**: Financial insights and calculations

### Frontend Pages (Planned)
- **Auth Pages**: Login, signup, password reset
- **Dashboard**: Overview of accounts and net worth
- **Accounts**: Account list and details
- **Transactions**: Transaction history and filtering
- **Portfolios**: Portfolio management and tracking
- **Analytics**: Financial insights and reporting
- **Settings**: User preferences and integrations

## Database Schema

### Core Tables
- **users**: User accounts and credentials
- **user_profiles**: User preferences and settings
- **accounts**: Connected financial accounts
- **transactions**: Individual transactions
- **transaction_categories**: Custom transaction categories
- **portfolios**: Investment portfolios
- **holdings**: Portfolio holdings (stocks, ETFs, etc.)
- **portfolio_metrics**: Portfolio performance metrics

## Integration Points

### Third-Party APIs
1. **Plaid**: Bank account aggregation
2. **Yahoo Finance**: Stock/ETF data
3. **CoinGecko/Binance**: Cryptocurrency data
4. **FinancialModelingPrep**: Financial statement data

### Authentication
- JWT tokens for stateless authentication
- Refresh tokens for extended sessions
- Role-based access control (RBAC) for future multi-user scenarios

## Security Considerations

- Passwords: bcrypt hashing
- API Authentication: JWT tokens
- Database: Encrypted connections, prepared statements via Prisma
- External APIs: Secure token storage, encrypted in database
- Frontend: HTTPS only, secure cookie storage
- CORS: Configured for frontend origin only

## Scalability Strategy

- **Database**: PostgreSQL with indexing on frequently queried columns
- **API**: Horizontal scaling via load balancer
- **Caching**: Redis for session storage and API response caching (future)
- **Message Queue**: Bull/Redis for async jobs like data sync (future)
- **CDN**: CloudFront for static assets (future)

## Development Workflow

1. Create feature branch from `main`
2. Develop feature using monorepo structure
3. Test across affected workspaces
4. Submit PR with description of changes
5. Code review and merge to `main`
6. Deploy to production

## Environment Configuration

See `.env.example` for all required environment variables. Different environments (dev, staging, prod) use separate .env files.

## Next Steps

1. Set up PostgreSQL database
2. Run Prisma migrations
3. Implement authentication module
4. Implement Plaid integration
5. Build dashboard UI
6. Add transaction management features
7. Implement portfolio tracking
8. Add financial analytics
