# Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ ([download](https://nodejs.org/))
- PostgreSQL 14+ ([download](https://www.postgresql.org/download/))
- Git ([download](https://git-scm.com/))
- Code editor (VS Code recommended)

### Initial Setup

1. **Clone and install dependencies**
```bash
cd "C:\Users\DELL\Documents\Projetos Pessoais\Finance Hub"
npm install
```

2. **Set up environment variables**
```bash
# Copy example file
copy .env.example .env.local

# Edit .env.local with your local database URL
# DATABASE_URL="postgresql://user:password@localhost:5432/financial_hub_dev"
```

3. **Set up PostgreSQL database**
```bash
# Using PostgreSQL
createdb financial_hub_dev

# Or using GUI tools like pgAdmin
```

4. **Run database migrations**
```bash
# Generate Prisma client
npm run prisma:generate --workspace=@financial-hub/data

# Run migrations
npx prisma migrate dev --schema=libs/data/prisma/schema.prisma
```

5. **Start development servers**
```bash
# From project root
npm run dev

# This will start:
# - API: http://localhost:3001
# - Web: http://localhost:3000
```

## Project Structure Explanation

### Apps Directory

#### `apps/api`
NestJS backend application handling:
- REST API endpoints
- Business logic
- Database operations
- External service integrations

**Key files:**
- `src/main.ts`: Application entry point
- `src/app.module.ts`: Main NestJS module
- `nest-cli.json`: NestJS CLI configuration

**Commands:**
```bash
npm run dev --workspace=apps/api       # Development
npm run build --workspace=apps/api     # Build
npm run test --workspace=apps/api      # Tests
```

#### `apps/web`
Next.js frontend application providing:
- User interface
- Dashboard and analytics
- Account management
- Transaction tracking

**Key directories:**
- `src/pages/`: Route handlers (Next.js)
- `src/components/`: Reusable React components
- `src/styles/`: TailwindCSS stylesheets

**Commands:**
```bash
npm run dev --workspace=apps/web       # Development
npm run build --workspace=apps/web     # Build
npm run start --workspace=apps/web     # Production
```

### Libs Directory

#### `libs/core`
Domain models and business logic interfaces:
- User, Account, Transaction, Portfolio models
- Service interfaces (DataAggregationService, AnalysisService)
- Business rules and validations

**When to use:** Define domain logic that's shared between API and analysis services.

#### `libs/data`
Data layer and database models:
- Prisma schema definition
- Database migrations
- ORM utilities

**When to use:** Access database or define database-related logic.

#### `libs/common`
Shared utilities and types:
- Constants (currencies, account types)
- DTOs (Data Transfer Objects)
- Utility functions (validators, formatters)
- API response types

**When to use:** Need shared constants, types, or utilities across apps.

## Database Management

### Prisma Commands

```bash
# Generate Prisma client (run after schema changes)
npm run prisma:generate --workspace=@financial-hub/data

# Create and run migrations
npx prisma migrate dev --schema=libs/data/prisma/schema.prisma

# View database (opens Prisma Studio)
npm run prisma:studio --workspace=@financial-hub/data

# Create migration without running it
npx prisma migrate dev --schema=libs/data/prisma/schema.prisma --skip-generate

# Reset database (DELETES DATA - dev only)
npx prisma migrate reset --schema=libs/data/prisma/schema.prisma
```

### Updating Schema

1. Edit `libs/data/prisma/schema.prisma`
2. Run `npx prisma migrate dev --schema=libs/data/prisma/schema.prisma`
3. Name the migration (e.g., "add_portfolio_table")
4. Prisma generates migration file and updates client

## Development Workflow

### Creating a New Feature

1. **Create feature branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Add database changes (if needed)**
   - Edit `libs/data/prisma/schema.prisma`
   - Run migrations

3. **Add/update domain models**
   - Edit files in `libs/core/src/models/`
   - Update `libs/core/src/index.ts` if needed

4. **Implement API endpoint**
   - Create controller in `apps/api/src/controllers/`
   - Create service in `apps/api/src/services/`
   - Import in module in `apps/api/src/modules/`

5. **Add frontend UI**
   - Create components in `apps/web/src/components/`
   - Create pages in `apps/web/src/pages/` if needed
   - Use API client services

6. **Test your changes**
```bash
npm run test --workspaces
```

7. **Commit and push**
```bash
git add .
git commit -m "feat: describe your feature"
git push origin feature/your-feature-name
```

## Debugging

### API (Node.js)
```bash
# VS Code debug configuration - .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "API Debug",
      "program": "${workspaceFolder}/apps/api/node_modules/@nestjs/cli/bin/nest.js",
      "args": ["start", "--watch"],
      "cwd": "${workspaceFolder}/apps/api"
    }
  ]
}
```

### Frontend (Next.js)
- Use browser DevTools (F12)
- Add `debugger` statements
- Use React Developer Tools browser extension

### Database
```bash
# Open Prisma Studio
npm run prisma:studio --workspace=@financial-hub/data
```

## Code Style

### ESLint Configuration
```bash
npm run lint --workspaces
npm run lint --workspace=apps/api -- --fix
```

### TypeScript
- Strict mode enabled
- Enforce types throughout
- No `any` types without justification

## Common Tasks

### Add a new database table
1. Edit `libs/data/prisma/schema.prisma`
2. Run: `npx prisma migrate dev --schema=libs/data/prisma/schema.prisma`
3. Regenerate Prisma client: `npm run prisma:generate --workspace=@financial-hub/data`

### Add a new API endpoint
1. Create controller method in `apps/api/src/controllers/`
2. Create/update service in `apps/api/src/services/`
3. Add DTO in `libs/common/src/dtos/`
4. Add route to module

### Add a new frontend page
1. Create file in `apps/web/src/pages/`
2. Create components in `apps/web/src/components/`
3. Update navigation if needed

### Use shared utilities
```typescript
import { formatCurrency, isValidEmail } from '@financial-hub/common';
import { Account, User } from '@financial-hub/core';
import { PrismaService } from '@financial-hub/data';
```

## Performance Tips

- Use Prisma `include`/`select` for efficient queries
- Implement pagination for large datasets
- Cache frequently accessed data
- Use indexes on frequently queried columns
- Lazy load images on frontend

## Troubleshooting

### Port already in use
```bash
# Find and kill process on port 3000/3001
lsof -ti:3000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :3000   # Windows
```

### Database connection issues
- Verify PostgreSQL is running
- Check DATABASE_URL in .env.local
- Ensure credentials are correct
- Check database name exists

### Node modules issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Need Help?

- Check existing issues on GitHub
- Review documentation in `/docs`
- Review code in similar features
- Ask in project discussions
