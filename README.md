# Financial Hub

A comprehensive financial data aggregation and portfolio management platform. Collect, analyze, and visualize your financial data from multiple sources in one unified dashboard.

## Architecture

This is a monorepo project with the following structure:

```
financial-hub/
├── apps/
│   ├── api/              # Backend API (NestJS)
│   └── web/              # Frontend Web App (Next.js)
├── libs/
│   ├── core/             # Core business logic & domain models
│   ├── data/             # Data aggregation & database models
│   └── common/           # Shared utilities & types
└── docs/                 # Documentation
```

## Tech Stack

- **Backend**: NestJS + TypeScript + PostgreSQL + Prisma
- **Frontend**: Next.js + React + TypeScript
- **Data Aggregation**: Plaid API, Yahoo Finance, custom scrapers
- **Styling**: TailwindCSS
- **Database**: PostgreSQL with Prisma ORM
- **Package Manager**: npm workspaces

## Key Features (Roadmap)

- [ ] Multi-account aggregation (bank accounts, investment accounts, crypto wallets)
- [ ] Real-time data synchronization via Plaid
- [ ] Portfolio tracking and analysis
- [ ] Transaction categorization & budgeting
- [ ] Multi-currency support
- [ ] Financial insights & recommendations
- [ ] Export & reporting capabilities

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- PostgreSQL >= 12 (local or Docker)

### Installation

```bash
# Clone and install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Configure database connection (see docs/DATABASE_SETUP.md)
# Edit .env and set DATABASE_URL to your PostgreSQL instance

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev
```

The frontend will be available at `http://localhost:3000` and the API at `http://localhost:3001`.

### Database Setup

**⚠️ Important**: Before running the application, you must set up PostgreSQL and run migrations.

#### Quick Start with Docker

```bash
# Start PostgreSQL container
docker-compose up -d postgres

# Wait for it to be healthy (check docker-compose ps)

# Run migrations
npm run db:migrate

# (Optional) View database in Prisma Studio
npm run db:studio
```

#### Local PostgreSQL Setup

See [docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md) for detailed instructions on:
- Installing PostgreSQL locally
- Creating the database
- Running migrations
- Troubleshooting connection issues

## Project Structure

### Apps

- **api**: REST API backend handling data aggregation, business logic, and database operations
- **web**: Next.js frontend with dashboard, account management, and analytics

### Libs

- **core**: Domain models, business logic, and service interfaces
- **data**: Data aggregation logic, data source integrations, and Prisma schema
- **common**: Shared types, utilities, constants, and DTOs

## Development

### Commands

```bash
# Development
npm run dev

# Build all packages
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## Inspiration & References

This project is inspired by:
- [Ghostfolio](https://github.com/ghostfolio/ghostfolio) - Modern wealth management architecture
- [Firefly III](https://github.com/firefly-iii/firefly-iii) - Financial data modeling
- [FinanceToolkit](https://github.com/JerBouma/FinanceToolkit) - Financial analysis patterns
- [Plaid Integration](https://plaid.com/) - Bank data aggregation

## License

MIT

## Next Steps

1. Set up individual app configurations (API & Web)
2. Create database schema & Prisma setup
3. Implement authentication & authorization
4. Set up Plaid integration for bank account aggregation
5. Build core dashboard interface
