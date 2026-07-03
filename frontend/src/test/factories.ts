/**
 * Mock data factories for testing
 * These functions create test data objects with sensible defaults
 */

export const mockUser = (overrides = {}) => ({
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'CLIENT',
    verified: true,
    hasOnboarded: true,
    ...overrides,
});

export const mockBabalawo = (overrides = {}) => ({
    id: 'baba-1',
    email: 'babalawo@example.com',
    name: 'Babalawo Test',
    role: 'BABALAWO',
    verified: true,
    hasOnboarded: true,
    bio: 'Experienced Babalawo',
    ...overrides,
});

export const mockAppointment = (overrides = {}) => ({
    id: 'appt-1',
    babalawoId: 'baba-1',
    clientId: 'client-1',
    date: '2026-12-01',
    time: '10:00',
    timezone: 'Africa/Lagos',
    duration: 60,
    status: 'UPCOMING',
    price: 5000,
    topic: 'Consultation',
    ...overrides,
});

export const mockProduct = (overrides = {}) => ({
    id: 'prod-1',
    vendorId: 'vendor-1',
    name: 'Test Product',
    description: 'A test product',
    price: 1000,
    currency: 'NGN',
    category: 'artifacts',
    type: 'PHYSICAL',
    stock: 10,
    images: ['/test-image.jpg'],
    status: 'ACTIVE',
    ...overrides,
});

export const mockOrder = (overrides = {}) => ({
    id: 'order-1',
    customerId: 'customer-1',
    vendorId: 'vendor-1',
    status: 'PENDING',
    totalAmount: 1000,
    currency: 'NGN',
    items: [
        {
            id: 'item-1',
            productId: 'prod-1',
            quantity: 1,
            price: 1000,
        },
    ],
    ...overrides,
});

export const mockGuidancePlan = (overrides = {}) => ({
    id: 'plan-1',
    appointmentId: 'appt-1',
    babalawoId: 'baba-1',
    clientId: 'client-1',
    type: 'AKOSE',
    items: [
        { name: 'Herbs', quantity: 1, description: 'Medicinal herbs', cost: 500 },
    ],
    totalCost: 500,
    platformServiceFee: 100,
    currency: 'NGN',
    status: 'PENDING',
    ...overrides,
});

export const mockWallet = (overrides = {}) => ({
    id: 'wallet-1',
    userId: 'user-1',
    balance: 10000,
    currency: 'NGN',
    locked: false,
    ...overrides,
});

export const mockTransaction = (overrides = {}) => ({
    id: 'tx-1',
    walletId: 'wallet-1',
    userId: 'user-1',
    type: 'DEPOSIT',
    amount: 1000,
    currency: 'NGN',
    status: 'COMPLETED',
    reference: 'ref-123',
    createdAt: new Date().toISOString(),
    ...overrides,
});

export const mockMessage = (overrides = {}) => ({
    id: 'msg-1',
    senderId: 'user-1',
    receiverId: 'user-2',
    content: 'Test message',
    encrypted: false,
    read: false,
    createdAt: new Date().toISOString(),
    ...overrides,
});
