# Backend Testing Guide

## Overview

This guide provides standards, patterns, and examples for writing tests in the Ilé Àṣẹ backend.

**Current Coverage:**
- Backend unit tests: **98%** for auth service (target: 80% overall)
- Integration tests: In progress
- E2E tests: In progress

---

## Test Stack

- **Framework:** Jest
- **NestJS Testing:** @nestjs/testing
- **Mocking:** Jest mocks
- **Utilities:** `src/test/test-utils.ts`

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.service.spec.ts

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov

# Debug tests
npm run test:debug
```

---

## Test File Organization

```
src/
├── auth/
│   ├── auth.service.ts           # Service implementation
│   ├── auth.service.spec.ts      # Unit tests (✅ 98% coverage)
│   └── auth.controller.spec.ts   # Controller tests
├── test/
│   └── test-utils.ts              # Shared test utilities
```

**Naming Convention:**
- Unit tests: `*.service.spec.ts`, `*.controller.spec.ts`
- Integration tests: `*.integration.test.ts`
- E2E tests: `test/e2e/*.e2e-spec.ts`

---

## Test Structure

### Basic Template

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { YourService } from './your.service';
import { PrismaService } from '../prisma/prisma.service';

describe('YourService', () => {
  let service: YourService;
  let prisma: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        YourService,
        {
          provide: PrismaService,
          useValue: {
            // Mock Prisma methods
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<YourService>(YourService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue({ id: 'user-123' });

      // Act
      const result = await service.methodName('user-123');

      // Assert
      expect(result).toBeDefined();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });
  });
});
```

---

## Using Test Utilities

The `src/test/test-utils.ts` file provides:

### 1. Mock Services

```typescript
import { mockPrismaService, mockConfigService, mockJwtService } from '../test/test-utils';

const module: TestingModule = await Test.createTestingModule({
  providers: [
    YourService,
    {
      provide: PrismaService,
      useValue: mockPrismaService(),
    },
    {
      provide: ConfigService,
      useValue: mockConfigService(),
    },
  ],
}).compile();
```

### 2. Test Data Factories

```typescript
import { createMockUser, createMockAppointment } from '../test/test-utils';

const user = createMockUser({ email: 'custom@example.com' });
const appointment = createMockAppointment({ status: 'confirmed' });
```

### 3. Helper Functions

```typescript
import { createTestingModule, getMock, resetAllMocks } from '../test/test-utils';

// Create module with common providers
const module = await createTestingModule([YourService]);

// Get typed mock
const prisma = getMock<PrismaService>(module, PrismaService);

// Reset all mocks
resetAllMocks();
```

---

## Testing Patterns

### Pattern 1: Testing Success Paths

```typescript
it('should successfully create user', async () => {
  // Arrange
  const dto = { email: 'test@example.com', name: 'Test User' };
  prisma.user.create.mockResolvedValue({ id: 'user-123', ...dto });

  // Act
  const result = await service.createUser(dto);

  // Assert
  expect(result).toHaveProperty('id', 'user-123');
  expect(prisma.user.create).toHaveBeenCalledWith({
    data: dto,
  });
});
```

### Pattern 2: Testing Error Paths

```typescript
it('should throw ConflictException if user exists', async () => {
  // Arrange
  prisma.user.findUnique.mockResolvedValue({ id: 'existing-user' });

  // Act & Assert
  await expect(service.createUser(dto)).rejects.toThrow(ConflictException);
  await expect(service.createUser(dto)).rejects.toThrow('User already exists');
});
```

### Pattern 3: Testing with Multiple Mocks

```typescript
it('should create user and send welcome email', async () => {
  // Arrange
  prisma.user.create.mockResolvedValue(mockUser);
  emailService.send.mockResolvedValue({ success: true });

  // Act
  await service.createUser(dto);

  // Assert
  expect(prisma.user.create).toHaveBeenCalled();
  expect(emailService.send).toHaveBeenCalledWith(
    expect.objectContaining({
      to: dto.email,
      subject: expect.stringContaining('Welcome'),
    })
  );
});
```

### Pattern 4: Testing Async Side Effects

```typescript
it('should send welcome message asynchronously', async () => {
  // Arrange
  prisma.user.create.mockResolvedValue(mockUser);
  messagingService.send.mockResolvedValue({ id: 'msg-123' });

  // Act
  await service.register(dto);

  // Wait for async side effect
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Assert
  expect(messagingService.send).toHaveBeenCalled();
});
```

### Pattern 5: Testing Environment Variables

```typescript
it('should throw error if JWT_SECRET is missing', async () => {
  // Arrange
  configService.get.mockReturnValue(undefined);

  // Act & Assert
  await expect(service.generateToken(user)).rejects.toThrow(
    'JWT_SECRET environment variable is required'
  );
});
```

### Pattern 6: Testing Conditional Logic

```typescript
it('should send welcome message only to CLIENT users', async () => {
  // Arrange - CLIENT user
  prisma.user.create.mockResolvedValue({ ...mockUser, role: 'CLIENT' });

  // Act
  await service.register({ ...dto, role: 'CLIENT' });

  // Assert
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(messagingService.send).toHaveBeenCalled();
});

it('should NOT send welcome message to ADMIN users', async () => {
  // Arrange - ADMIN user
  prisma.user.create.mockResolvedValue({ ...mockUser, role: 'ADMIN' });

  // Act
  await service.register({ ...dto, role: 'ADMIN' });

  // Assert
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(messagingService.send).not.toHaveBeenCalled();
});
```

---

## Coverage Targets

| Type | Target | Current (Auth Service) |
|------|--------|------------------------|
| **Statements** | 80% | 98.48% ✅ |
| **Branches** | 80% | 92.85% ✅ |
| **Functions** | 100% | 100% ✅ |
| **Lines** | 80% | 98.41% ✅ |

---

## Best Practices

### ✅ DO

1. **Follow AAA Pattern:** Arrange → Act → Assert
2. **Test one thing per test:** Each `it()` should verify a single behavior
3. **Use descriptive test names:** "should throw error if user not found" (not "test error")
4. **Mock external dependencies:** Prisma, external APIs, email services
5. **Test error paths:** Don't just test happy paths
6. **Clean up after tests:** Use `afterEach(() => jest.clearAllMocks())`
7. **Use type safety:** Cast mocks to `any` when needed for flexibility
8. **Test edge cases:** Empty arrays, null values, boundary conditions

### ❌ DON'T

1. **Don't test implementation details:** Test behavior, not internals
2. **Don't share state between tests:** Each test should be independent
3. **Don't use real database:** Always mock Prisma service
4. **Don't skip error tests:** Error paths are critical
5. **Don't test third-party libraries:** Trust bcrypt, jwt, etc. work
6. **Don't make assertions on mocks:** Test your code, not the mocks

---

## Common Mocking Scenarios

### Mocking @ile-ase/common Package

```typescript
// Mock at top of test file
jest.mock('@ile-ase/common', () => ({
  UserRole: {
    CLIENT: 'CLIENT',
    BABALAWO: 'BABALAWO',
    VENDOR: 'VENDOR',
    ADMIN: 'ADMIN',
  },
}));
```

### Mocking bcrypt

```typescript
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

// In test
(bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
(bcrypt.compare as jest.Mock).mockResolvedValue(true);
```

### Mocking Prisma Transactions

```typescript
prisma.$transaction.mockImplementation(async (callback) => {
  return await callback(prisma);
});
```

### Mocking Sequential Calls

```typescript
// Different return values for sequential calls
prisma.user.findUnique
  .mockResolvedValueOnce(null)      // First call returns null
  .mockResolvedValueOnce(mockUser); // Second call returns user
```

---

## Integration Tests

Integration tests verify interactions between modules and database.

```typescript
// Example: appointments/booking.integration.test.ts
import { PrismaClient } from '@prisma/client';

describe('Booking Integration', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasources: {
        db: { url: process.env.TEST_DATABASE_URL },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clean database before each test
    await prisma.appointment.deleteMany();
    await prisma.user.deleteMany();
  });

  it('should create booking with escrow', async () => {
    // Create real database records
    const user = await prisma.user.create({
      data: { email: 'test@example.com', name: 'Test' },
    });

    const appointment = await prisma.appointment.create({
      data: {
        clientId: user.id,
        babalawoId: 'babalawo-123',
        // ...
      },
    });

    expect(appointment.escrowId).toBeDefined();
  });
});
```

---

## Troubleshooting

### "Cannot find module '@ile-ase/common'"

**Solution:** Mock the module at the top of your test file:
```typescript
jest.mock('@ile-ase/common', () => ({
  UserRole: { CLIENT: 'CLIENT', ADMIN: 'ADMIN' },
}));
```

### "Property 'mockResolvedValue' does not exist"

**Solution:** Use `any` type for service mocks:
```typescript
let prisma: any;
prisma = module.get(PrismaService);
```

### Tests pass but coverage is 0%

**Solution:** Use `npm run test:cov` instead of `npm test -- --coverage`

### Async tests timing out

**Solution:** Increase timeout and wait for promises:
```typescript
it('should handle async', async () => {
  // ... test code
  await new Promise(resolve => setTimeout(resolve, 100));
}, 10000); // 10 second timeout
```

---

## Next Steps

1. ✅ Auth service: **98% coverage** (DONE)
2. ⚪ Appointments service: Target 80%
3. ⚪ Payments service: Target 80%
4. ⚪ Prescriptions service: Target 80%
5. ⚪ Wallet service: Target 80%

---

## Reference Example

See `src/auth/auth.service.spec.ts` for a comprehensive example of:
- All testing patterns
- 98% coverage
- 18 test cases
- Error handling
- Async testing
- Multiple mock scenarios

---

**Happy Testing! 🧪**
