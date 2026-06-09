# Financial Hub

A comprehensive financial data aggregation and portfolio management platform. Collect, analyze, and visualize your financial data from multiple sources in one unified dashboard.

## 🚀 **Quick Start** (< 5 minutes)

**Want to get up and running immediately?**

### Linux/macOS:
```bash
bash setup.sh && npm run dev
```

### Windows:
```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
npm run dev
```

Then open http://localhost:3000 and log in with:
- **Email**: `demo@financialhub.io`
- **Password**: `demo123456`

👉 **See [docs/QUICK-START.md](./docs/QUICK-START.md) for detailed walkthrough**

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
- PostgreSQL >= 12 (local or Docker) OR Docker Desktop

### Quick Start (Recommended)

#### Linux/macOS
```bash
# Run the setup script (it handles everything!)
bash setup.sh

# Then start development servers
npm run dev
```

#### Windows
```powershell
# Run the setup script (it handles everything!)
powershell -ExecutionPolicy Bypass -File setup.ps1

# Then start development servers
npm run dev
```

The setup script will:
- ✅ Verify Node.js version
- ✅ Install dependencies
- ✅ Create .env file (if needed)
- ✅ Start PostgreSQL via Docker (if available)
- ✅ Run database migrations
- ✅ Build shared libraries

**Result**: Frontend at http://localhost:3000, API at http://localhost:3001

### Manual Setup

If you prefer to set up manually:

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start PostgreSQL (choose one):
#   Option A: Docker
docker-compose up -d postgres

#   Option B: Local PostgreSQL (see docs/DATABASE_SETUP.md)

# Run migrations
npm run db:migrate

# Start development servers
npm run dev
```

### Database Management

```bash
# View the database in Prisma Studio
npm run db:studio

# Create a new migration (after schema changes)
npm run db:migrate

# Deploy migrations (production)
npm run db:migrate:deploy

# Reset database (⚠️ deletes all data)
npm run db:migrate:reset
```

### Database Setup Details

For detailed database setup instructions, including:
- Installing PostgreSQL locally (macOS, Windows, Linux)
- Using Docker for PostgreSQL
- Troubleshooting connection issues
- Seeding initial data

See [docs/DATABASE_SETUP.md](./docs/DATABASE_SETUP.md)

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
