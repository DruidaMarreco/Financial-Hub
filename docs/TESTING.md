# Testing Guide - Financial Hub

Comprehensive testing strategy and practices for Financial Hub.

## Overview

Financial Hub uses three levels of testing:

1. **Unit Tests** - Test individual functions and services
2. **Integration Tests** - Test modules and API endpoints
3. **E2E Tests** - Test user workflows end-to-end

## Running Tests

### All Tests

```bash
npm run test                    # Run all tests once
npm run test:watch             # Run tests in watch mode
npm run test:cov               # Run tests with coverage report
```

### By Workspace

```bash
npm run test --workspace=@financial-hub/api
npm run test --workspace=@financial-hub/web
```

### Specific Test File

```bash
npm run test -- auth.service.spec.ts
npm run test -- transactions.spec.ts
```

## Unit Tests

Unit tests test individual functions and services in isolation using Jest.

### Location
- Backend: `apps/api/src/**/*.spec.ts`
- Frontend: `apps/web/src/**/*.spec.ts`

### Example: Auth Service Test

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    }).compile();
    
    service = module.get<AuthService>(AuthService);
  });

  it('should signup user', async () => {
    const result = await service.signup('test@example.com', 'password');
    expect(result).toHaveProperty('access_token');
  });
});
```

### Writing Unit Tests

1. **Arrange** - Set up test data and mocks
2. **Act** - Call the function being tested
3. **Assert** - Verify the result

```typescript
it('should categorize transaction correctly', () => {
  // Arrange
  const transaction = { merchant: 'Starbucks', amount: 5.50 };
  
  // Act
  const result = categorizer.predict(transaction);
  
  // Assert
  expect(result.category).toBe('Coffee');
  expect(result.confidence).toBeGreaterThan(0.7);
});
```

### Mocking

```typescript
// Mock Prisma service
{
  provide: PrismaService,
  useValue: {
    user: {
      findUnique: jest.fn().mockResolvedValue(mockUser),
      create: jest.fn().mockResolvedValue(mockUser),
    },
  },
}
```

## Integration Tests

Integration tests verify that multiple components work together.

### Running Integration Tests

```bash
npm run test:integration
```

### Example: API Endpoint Test

```typescript
describe('POST /auth/signup', () => {
  it('should create user and return token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({ email: 'test@example.com', password: 'password' })
      .expect(201);

    expect(response.body).toHaveProperty('access_token');
  });
});
```

## E2E Tests

E2E tests use Playwright to test complete user workflows.

### Location
`apps/web/e2e/**/*.spec.ts`

### Running E2E Tests

```bash
npm run e2e              # Run tests headlessly
npm run e2e:ui           # Run with UI
npm run e2e:debug        # Run with debugger
```

### Example: Authentication E2E Test

```typescript
test('should signup and login', async ({ page }) => {
  // Navigate to signup
  await page.goto('http://localhost:3000/signup');
  
  // Fill form
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'Password123');
  await page.fill('input[placeholder="Confirm"]', 'Password123');
  
  // Submit
  await page.click('button:has-text("Sign Up")');
  
  // Verify redirect
  await expect(page).toHaveURL('http://localhost:3000/dashboard');
});
```

### Playwright Best Practices

1. **Use locators** instead of selectors:
```typescript
// Good
await page.locator('button:has-text("Submit")').click();

// Avoid
await page.locator('xpath=//button[contains(text(), "Submit")]').click();
```

2. **Wait for elements**:
```typescript
// Waits for element to be visible
await expect(page.locator('text=Success')).toBeVisible();

// Custom timeout
await expect(page.locator('text=Loading')).toBeVisible({ timeout: 5000 });
```

3. **Test user flows, not implementation**:
```typescript
// Good - tests the workflow
await page.fill('input[type="email"]', 'test@example.com');
await page.click('button:has-text("Login")');

// Avoid - implementation detail
await page.evaluate(() => store.dispatch('login'));
```

## Coverage Targets

### Backend (API)
- **Lines**: 80%+
- **Functions**: 80%+
- **Branches**: 75%+
- **Statements**: 80%+

### Frontend (Web)
- **Lines**: 70%+
- **Functions**: 70%+
- **Branches**: 65%+
- **Statements**: 70%+

### View Coverage Report

```bash
npm run test:cov
# Reports generated in coverage/
```

## Testing Checklist

Before committing code:

- [ ] Unit tests pass locally
- [ ] Coverage meets targets (80%+)
- [ ] No console errors or warnings
- [ ] No hardcoded test data
- [ ] All async operations properly awaited
- [ ] Error cases tested
- [ ] Edge cases covered

## Common Issues

### Tests Timing Out

```typescript
// Increase timeout
jest.setTimeout(30000);

// Or for specific test
test('long operation', async () => {
  // ...
}, 30000);
```

### Flaky E2E Tests

```typescript
// Wait for element to be ready
await page.locator('button').waitFor({ state: 'visible' });

// Use proper waits
await page.waitForNavigation();
```

### Mock Dependency Not Working

```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

## CI/CD Integration

Tests run automatically on:
- Push to any branch
- Pull requests to main/dev
- Scheduled nightly runs

See `.github/workflows/ci.yml` for pipeline details.

### View CI Results

1. Go to GitHub repo
2. Click "Actions" tab
3. Select workflow run
4. View logs and artifacts

## Test Utilities

### Mock Data Factories

```typescript
// apps/api/src/test/factories/user.factory.ts
export function createMockUser(overrides = {}) {
  return {
    id: '1',
    email: 'test@example.com',
    ...overrides,
  };
}
```

### API Test Helpers

```typescript
// apps/api/src/test/helpers/request.ts
export function createRequest(data: any) {
  return {
    body: data,
    user: { sub: '1' },
  };
}
```

## Performance Testing

### Load Testing

```bash
npm run test:load
# Uses k6 for load testing
```

### Memory Leaks

```bash
npm run test:memory
# Detects memory leaks
```

## Debugging Tests

### Debug Unit Test

```bash
node --inspect-brk ./node_modules/.bin/jest --runInBand auth.service.spec.ts
```

### Debug E2E Test

```bash
npx playwright test --debug
```

### View Test Traces

```bash
npx playwright show-trace path/to/trace.zip
```

## Test Organization

```
apps/
├── api/
│   └── src/
│       ├── auth/
│       │   ├── auth.service.ts
│       │   └── auth.service.spec.ts
│       ├── transactions/
│       │   ├── transactions.service.ts
│       │   └── transactions.service.spec.ts
│       └── test/
│           ├── fixtures/
│           ├── factories/
│           └── helpers/
└── web/
    ├── src/
    │   ├── pages/
    │   ├── components/
    │   └── __tests__/
    └── e2e/
        ├── auth.spec.ts
        └── transactions.spec.ts
```

## Best Practices

1. **One assertion per test** (when possible)
2. **Clear test names** that describe the behavior
3. **Test behavior, not implementation**
4. **Avoid test interdependencies**
5. **Keep tests fast** (< 1s per unit test)
6. **Mock external services**
7. **Use factories** for complex test data
8. **Clean up after tests** (afterEach cleanup)

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

## Support

For testing questions:
- Check existing test examples
- Review test utilities in `apps/*/src/test/`
- Refer to framework documentation
- Ask in team discussions
