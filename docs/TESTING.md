# Financial Hub - Testing Guide

Complete testing strategy for bank integration features.

## Test Levels

1. **Unit Tests** - Individual functions/methods  
2. **Integration Tests** - Multiple components working together  
3. **E2E Tests** - Full user workflows  
4. **CI/CD Tests** - Automated validation on every commit  

## Running Tests

```bash
npm test                                    # Run all tests
npm test -- --selectProjects=api           # API tests only
npm test -- --selectProjects=web           # Frontend tests only
npm test -- --watch                         # Watch mode
npm test -- --coverage                      # With coverage report
```

## Test Coverage

**Required Minimums:**
- Bank Integration Module: 80%
- Web Components: 75%
- Global: 60%

## Backend Tests

### RevolutService Tests
- OAuth authorization URL generation
- Authorization code → token exchange
- Token refresh mechanism
- Account fetching
- Transaction fetching with date ranges
- Transaction categorization
- Exchange rate fetching
- Sandbox vs production mode

### IntegrationsService Tests
- Credential storage & encryption
- Account syncing workflow
- Full data sync (accounts + transactions)
- Error resilience
- Status checking

## Frontend Tests

### BankConnectionModal Tests
- Modal visibility states
- Bank selection UI
- Revolut OAuth flow
- Error handling
- Loading states
- Accessibility features

### OAuth Callback Tests
- Loading state
- Successful connection flow
- Error handling
- Authorization token handling
- Account sync confirmation
- Redirect on success

## CI/CD Pipeline

GitHub Actions runs on push/PR with:
- ✅ Lint & Type Check
- ✅ Unit Tests + Coverage
- ✅ Build Verification
- ✅ Security Audit
- 🚀 Auto-deploy (on main/dev)

## Writing Tests

```typescript
describe('Feature', () => {
  beforeEach(() => { /* setup */ });
  
  it('should perform action', async () => {
    const result = await service.method();
    expect(result).toBeDefined();
  });
});
```

## Coverage Commands

```bash
npm test -- --coverage                    # Generate coverage report
npm test -- --coverage --selectProjects=api  # API coverage only
```

View report: `coverage/lcov-report/index.html`

