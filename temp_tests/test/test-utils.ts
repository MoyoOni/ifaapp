/**
 * Test Utilities for Backend Unit Tests
 * Provides common mocks, factories, and helpers
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

/**
 * Mock Prisma Service
 * Use this to mock database operations in unit tests
 */
export const mockPrismaService = () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  temple: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  babalawo: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  appointment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  payment: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  prescription: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  wallet: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  walletTransaction: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  $transaction: jest.fn(),
});

/**
 * Mock Config Service
 * Use this to provide environment variables in tests
 */
export const mockConfigService = () => ({
  get: jest.fn((key: string) => {
    const config: Record<string, any> = {
      JWT_SECRET: 'test-secret',
      JWT_EXPIRES_IN: '24h',
      PAYSTACK_SECRET_KEY: 'test-paystack-key',
      FLUTTERWAVE_SECRET_KEY: 'test-flutterwave-key',
      AWS_S3_BUCKET: 'test-bucket',
      SENDGRID_API_KEY: 'test-sendgrid-key',
    };
    return config[key];
  }),
});

/**
 * Mock JWT Service
 * Use this to mock token generation/verification
 */
export const mockJwtService = () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
  verify: jest.fn(() => ({ userId: 'test-user-id' })),
});

/**
 * Test Data Factories
 * Use these to create consistent test data
 */

export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'client',
  phoneNumber: '+2348012345678',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'male',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockBabalawo = (overrides = {}) => ({
  id: 'babalawo-123',
  userId: 'user-123',
  title: 'Chief Priest',
  yearsOfPractice: 15,
  specializations: ['Divination', 'Healing'],
  hourlyRate: 5000,
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockTemple = (overrides = {}) => ({
  id: 'temple-123',
  name: 'Ilé Ifá Test Temple',
  description: 'Test temple for unit tests',
  address: '123 Test Street, Lagos',
  isVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockAppointment = (overrides = {}) => ({
  id: 'appointment-123',
  clientId: 'client-123',
  babalawoId: 'babalawo-123',
  consultationType: 'divination',
  scheduledAt: new Date(Date.now() + 86400000), // Tomorrow
  duration: 60,
  status: 'pending',
  price: 5000,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockPayment = (overrides = {}) => ({
  id: 'payment-123',
  userId: 'user-123',
  amount: 5000,
  currency: 'NGN',
  provider: 'paystack',
  status: 'success',
  reference: 'test-ref-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockPrescription = (overrides = {}) => ({
  id: 'prescription-123',
  clientId: 'client-123',
  babalawoId: 'babalawo-123',
  appointmentId: 'appointment-123',
  diagnosis: 'Test diagnosis',
  recommendations: ['Test recommendation 1', 'Test recommendation 2'],
  status: 'pending',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockWallet = (overrides = {}) => ({
  id: 'wallet-123',
  userId: 'user-123',
  balance: 10000,
  currency: 'NGN',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

/**
 * Helper to create a testing module with common providers
 */
export const createTestingModule = async (
  providers: any[],
  imports: any[] = []
): Promise<TestingModule> => {
  return await Test.createTestingModule({
    imports,
    providers: [
      ...providers,
      {
        provide: PrismaService,
        useValue: mockPrismaService(),
      },
      {
        provide: ConfigService,
        useValue: mockConfigService(),
      },
      {
        provide: JwtService,
        useValue: mockJwtService(),
      },
    ],
  }).compile();
};

/**
 * Helper to extract mock from module
 */
export const getMock = <T = any>(module: TestingModule, token: any): jest.Mocked<T> => {
  return module.get(token) as jest.Mocked<T>;
};

/**
 * Helper to reset all mocks
 */
export const resetAllMocks = () => {
  jest.clearAllMocks();
  jest.resetAllMocks();
};
