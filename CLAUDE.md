# Claude Code Instructions for Financial Hub

## Project Overview
Financial Hub is a personal finance aggregation platform built with a monorepo structure. It collects financial data from multiple sources (banks, investments, crypto) and provides comprehensive analysis and insights.

## Architecture
- **Monorepo**: npm workspaces
- **Backend**: NestJS + TypeScript + PostgreSQL + Prisma
- **Frontend**: Next.js + React + TypeScript + TailwindCSS
- **Shared Libraries**: 
  - `@financial-hub/core` - Domain models
  - `@financial-hub/data` - Database layer
  - `@financial-hub/common` - Utilities and types

## Key Commands
```bash
npm install                    # Install all dependencies
npm run dev                   # Start API + Web dev servers
npm run build                 # Build all packages
npm run lint --workspaces    # Lint all packages
npm run prisma:generate --workspace=@financial-hub/data    # Update Prisma client
npx prisma migrate dev --schema=libs/data/prisma/schema.prisma  # Create migration
npm run prisma:studio --workspace=@financial-hub/data  # Open Prisma Studio
```

## File Organization

### When working on features:
1. **Database changes** → Edit `libs/data/prisma/schema.prisma`, then run migration
2. **Domain models** → Edit `libs/core/src/models/`
3. **Shared types/utilities** → Edit `libs/common/src/`
4. **API endpoints** → Create files in `apps/api/src/`
5. **Frontend pages/components** → Create files in `apps/web/src/`

### Import paths:
- From core: `import { User, Account } from '@financial-hub/core'`
- From common: `import { formatCurrency } from '@financial-hub/common'`
- From data: `import { PrismaService } from '@financial-hub/data'`

## Development Guidelines

### Code Style
- Use TypeScript strict mode (no `any` types)
- Follow NestJS module structure (controllers, services, modules)
- Use React hooks and functional components
- Prefer composition over inheritance
- Keep functions small and focused

### Database
- Always use Prisma for database operations
- Include proper indexes on frequently queried columns
- Use transactions for operations spanning multiple tables
- Add migrations with meaningful names

### API Design
- RESTful endpoints with proper HTTP methods
- Return consistent ApiResponse<T> format
- Implement proper error handling with AppError
- Validate all input with DTOs and class-validator

### Frontend
- Use TailwindCSS for styling
- Create reusable components in `src/components/`
- Use Zustand for state management
- Use SWR for data fetching
- Add TypeScript types for all props

## Workspace Management
- Use `--workspace=@financial-hub/api` or `--workspace=apps/api` when running scripts
- All workspaces share root `node_modules`
- Changes to shared libs require `npm install` in dependent packages

## Common Tasks

### Add a new database table
```bash
# 1. Edit libs/data/prisma/schema.prisma
# 2. Run migration
npx prisma migrate dev --schema=libs/data/prisma/schema.prisma --name "add_new_table"
# 3. Regenerate Prisma client
npm run prisma:generate --workspace=@financial-hub/data
```

### Add a new API feature
1. Create domain model in `libs/core/src/models/` if needed
2. Update Prisma schema if database changes needed
3. Create DTO in `libs/common/src/dtos/` for input validation
4. Create controller in `apps/api/src/controllers/`
5. Create service in `apps/api/src/services/`
6. Register in module in `apps/api/src/modules/`

### Add a new frontend page
1. Create page file in `apps/web/src/pages/` (Next.js routing)
2. Create components in `apps/web/src/components/` as needed
3. Add types/interfaces in `libs/common/src/types/` if shared
4. Import and use API services

## Testing
- Tests should be in same directory as code with `.test.ts` or `.spec.ts` suffix
- Use Jest for both API and library testing
- Test database operations with real database or seed data
- Mock external services (Plaid, Yahoo Finance, etc.)

## Git Conventions
- Branch naming: `feature/description`, `fix/description`, `refactor/description`
- Commit messages: `type(scope): description` (e.g., `feat(accounts): add plaid integration`)
- Keep commits atomic - one logical change per commit
- Update relevant documentation when code changes

## Performance Considerations
- Use Prisma `select()` and `include()` to fetch only needed fields
- Implement pagination for large datasets
- Cache frequently accessed data
- Use database indexes on foreign keys and filtered columns
- Lazy load components/routes on frontend

## Security Notes
- Never commit `.env.local` or secrets
- Use environment variables for all configuration
- Hash passwords with bcrypt in backend
- Validate all user input on server side
- Use prepared statements (Prisma handles this)
- Implement rate limiting for API endpoints (TODO)

## Documentation
- Keep `docs/ARCHITECTURE.md` updated when making structural changes
- Update `docs/DEVELOPMENT.md` when development workflow changes
- Add JSDoc comments for complex functions
- Document third-party integrations in code

## Environment Setup
- `DATABASE_URL` must point to PostgreSQL instance
- Get Plaid credentials from Plaid dashboard (sandbox/development/production)
- All API keys should be in `.env.local` (not committed)
- Use `.env.example` as template for new developers

## Current Status
- Project skeleton created with monorepo structure
- Database schema defined (Prisma)
- Core domain models defined
- Common utilities and types created
- API bootstrap configured
- Frontend landing page created

## Next Priority Features
1. User authentication (signup/login)
2. Plaid integration for bank account aggregation
3. Account management and display
4. Transaction tracking and categorization
5. Portfolio management
6. Financial analytics and insights
7. Reports and exports

## Contact/Questions
For architecture questions or significant changes, review with project owner.

## Additional Resources
- `/docs/ARCHITECTURE.md` - System design
- `/docs/DEVELOPMENT.md` - Development guide
- Root `README.md` - Quick start
