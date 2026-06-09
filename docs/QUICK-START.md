# Financial Hub - Quick Start Guide

Get the Financial Hub running on your machine in **less than 10 minutes**.

## ⚡ Ultra-Quick Start (5 minutes)

### For Linux/macOS:
```bash
bash setup.sh && npm run dev
```

### For Windows:
```powershell
powershell -ExecutionPolicy Bypass -File setup.ps1
npm run dev
```

Done! Open:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001

---

## 📋 Step-by-Step Setup

### 1. Clone and Install (2 minutes)

```bash
# Clone repository
git clone https://github.com/DruidaMarreco/Financial-Hub.git
cd Financial-Hub

# Install dependencies
npm install
```

### 2. Set Up Database (2 minutes)

```bash
# Copy environment file
cp .env.example .env

# Start PostgreSQL
docker-compose up -d postgres

# Wait a few seconds for PostgreSQL to be healthy

# Run migrations
npm run db:migrate
```

### 3. Seed Demo Data (1 minute)

```bash
# Populate database with realistic test data
npm run db:seed

# This creates:
# - Demo user: demo@financialhub.io / demo123456
# - 4 sample accounts with €45,000 total balance
# - 30 realistic transactions
# - Investment portfolio with holdings
```

### 4. Start Development Servers (1 minute)

```bash
npm run dev
```

You'll see output like:
```
> api dev server running at http://localhost:3001
> web dev server running at http://localhost:3000
```

---

## 🔑 Demo User Credentials

| Field | Value |
|-------|-------|
| Email | `demo@financialhub.io` |
| Password | `demo123456` |

Use these to log in and explore the app!

---

## 🎯 What You Can Do Now

### With Demo Data:
- ✅ View dashboard with €45,000 total balance
- ✅ Explore 4 sample financial accounts
- ✅ Browse 30 transactions across categories
- ✅ View investment portfolio with gains/losses
- ✅ Check categorization and analytics
- ✅ Test filtering and search features

### Development:
- ✅ Modify components and see live updates
- ✅ Test API endpoints with real data
- ✅ Build new features on stable foundation
- ✅ Run tests and lint checks

---

## 📚 Available Commands

```bash
# Development
npm run dev                    # Start both API and web servers

# Building
npm run build                  # Build all packages
npm run build --workspace=apps/api    # Build just the API
npm run build --workspace=apps/web    # Build just the web app

# Database
npm run db:migrate             # Run pending migrations
npm run db:migrate:deploy      # Deploy migrations (production)
npm run db:migrate:reset       # ⚠️ Reset database (deletes all data)
npm run db:seed                # Populate with demo data
npm run db:studio              # Open Prisma Studio (database viewer)

# Testing & Quality
npm run test                   # Run all tests
npm run lint                   # Lint all packages
npm test -- --watch            # Run tests in watch mode

# Individual Workspaces
npm run dev --workspace=apps/api      # API only
npm run dev --workspace=apps/web      # Web only
npm run test --workspace=libs/data    # Test data layer only
```

---

## 🏗️ Project Structure

```
financial-hub/
├── apps/
│   ├── api/           # NestJS backend (port 3001)
│   └── web/           # Next.js frontend (port 3000)
├── libs/
│   ├── core/          # Domain models & business logic
│   ├── data/          # Database layer (Prisma)
│   └── common/        # Shared utilities & types
├── docs/              # Documentation
│   ├── QUICK-START.md ← You are here
│   ├── DATABASE_SETUP.md
│   ├── DEMO-DATA.md
│   └── ...
└── setup.sh / setup.ps1  # One-command setup scripts
```

---

## 🔍 Explore the Features

### Dashboard (http://localhost:3000)
- Overview of all accounts and balances
- Recent transactions
- Portfolio performance
- Financial insights

### Accounts Page
- List all connected accounts
- View account details
- Add new accounts

### Transactions Page
- Browse transaction history
- Filter by date, category, amount
- Categorize transactions
- View transaction details

### Analytics Page
- Spending by category
- Income vs expenses
- Trends over time
- Budget vs actual

### Settings Page
- User profile preferences
- Connected integrations
- Account management

---

## 🚀 Next Steps

### For Feature Development:
1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes (code syncs live with `npm run dev`)
3. Commit: `git commit -m "feat: description"`
4. Push and create PR

### For Integration Testing:
1. Get Plaid credentials from https://dashboard.plaid.com
2. Add to `.env`: `PLAID_CLIENT_ID=...`, `PLAID_SECRET=...`
3. Test bank account linking in the app

### For Deployment:
See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup on Raspberry Pi or cloud platforms.

---

## 🐛 Troubleshooting

### "docker: command not found"
Docker is not installed. Either:
- Install Docker: https://www.docker.com/products/docker-desktop
- OR install PostgreSQL locally (see DATABASE_SETUP.md)

### "Port 3000 already in use"
Another app is using port 3000. Either:
- Stop the other app
- Use a different port: `PORT=3002 npm run dev`

### "Can't connect to database"
- Check PostgreSQL is running: `docker-compose ps`
- Check DATABASE_URL in `.env`
- Try resetting: `npm run db:migrate:reset && npm run db:seed`

### "Migrations failed"
1. Verify database exists
2. Check PostgreSQL is healthy: `docker-compose logs postgres`
3. Reset and try again: `npm run db:migrate:reset`

### "Seed script failed"
1. Make sure migrations ran: `npm run db:migrate`
2. Check bcrypt installed: `npm list bcrypt`
3. Run manually: `npm run db:seed --workspace=libs/data`

---

## 📖 More Documentation

| Document | Purpose |
|----------|---------|
| [README.md](../README.md) | Project overview |
| [DATABASE_SETUP.md](./DATABASE_SETUP.md) | Detailed database configuration |
| [DEMO-DATA.md](./DEMO-DATA.md) | Demo data & seeding details |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | Development workflow & conventions |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design & architecture |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production deployment guide |
| [CLAUDE.md](../CLAUDE.md) | AI assistant instructions |

---

## 🎓 Learning Path

1. **Start here**: This Quick Start guide
2. **Explore**: Open http://localhost:3000 and click around
3. **Code**: Make a small change to see hot reload
4. **Learn**: Read DEVELOPMENT.md for conventions
5. **Build**: Create your first feature

---

## ✅ Quick Checklist

- [ ] Cloned repository
- [ ] Ran `npm install`
- [ ] Created `.env` file
- [ ] Started PostgreSQL (`docker-compose up -d postgres`)
- [ ] Ran migrations (`npm run db:migrate`)
- [ ] Seeded demo data (`npm run db:seed`)
- [ ] Started dev servers (`npm run dev`)
- [ ] Opened http://localhost:3000
- [ ] Logged in with demo credentials
- [ ] Explored the dashboard

If all checked, you're ready to develop! 🚀

---

## 🤝 Need Help?

1. Check [Troubleshooting](#troubleshooting) above
2. Review relevant documentation file
3. Check git history: `git log --oneline`
4. Open an issue on GitHub with details

---

**You're all set!** Happy coding! 🎉

