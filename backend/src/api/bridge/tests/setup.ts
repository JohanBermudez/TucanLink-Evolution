import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, '../../../.env.test')
});

// Set test environment
process.env.NODE_ENV = 'test';
process.env.API_BRIDGE_PORT = '8091';
process.env.API_BRIDGE_JWT_SECRET = 'test-jwt-secret';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'tucanlink_test';
process.env.DB_USER = 'test';
process.env.DB_PASS = 'test';
process.env.IO_REDIS_SERVER = 'localhost';
process.env.IO_REDIS_PORT = '6379';

// Mock console methods in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock timers
jest.useFakeTimers();

// Increase timeout for async operations
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Global test utilities
export const mockRequest = (options: any = {}) => ({
  headers: {},
  query: {},
  params: {},
  body: {},
  ...options,
});

export const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.setHeader = jest.fn().mockReturnValue(res);
  return res;
};

export const mockNext = jest.fn();

// Test data factories
export const createTestUser = (overrides = {}) => ({
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  profile: 'user',
  companyId: 1,
  ...overrides,
});

export const createTestCompany = (overrides = {}) => ({
  id: 1,
  name: 'Test Company',
  status: 'active',
  ...overrides,
});

export const createTestApiKey = (overrides = {}) => ({
  key: 'tlk_test123456789',
  companyId: 1,
  name: 'Test API Key',
  permissions: ['tickets:read', 'messages:send'],
  isActive: true,
  ...overrides,
});

// Mock implementations
export const mockJwtService = {
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  generateTokenPair: jest.fn(),
  verifyToken: jest.fn(),
  refreshAccessToken: jest.fn(),
  decodeToken: jest.fn(),
  isTokenExpired: jest.fn(),
  getTokenExpiration: jest.fn(),
  validateTokenClaims: jest.fn(),
};

export const mockApiKeyService = {
  generateApiKey: jest.fn(),
  validateApiKey: jest.fn(),
  revokeApiKey: jest.fn(),
  checkRateLimit: jest.fn(),
  updateLastUsed: jest.fn(),
  getApiKeyMetrics: jest.fn(),
  listApiKeys: jest.fn(),
  updatePermissions: jest.fn(),
  hasPermission: jest.fn(),
  verifyApiKey: jest.fn(),
  clearCache: jest.fn(),
  getCacheStats: jest.fn(),
};

export const mockEventBus = {
  publish: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  publishBatch: jest.fn(),
  getEventHistory: jest.fn(),
  getQueueStats: jest.fn(),
  clearQueue: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  close: jest.fn(),
};

export const mockWebSocketService = {
  emitToCompany: jest.fn(),
  emitToUser: jest.fn(),
  emitEvent: jest.fn(),
  broadcast: jest.fn(),
  getConnectionsCount: jest.fn(),
  getCompanyConnectionsCount: jest.fn(),
  getActiveCompanies: jest.fn(),
  isUserConnected: jest.fn(),
  getStats: jest.fn(),
  disconnectCompany: jest.fn(),
};

export const mockWebhookService = {
  registerWebhook: jest.fn(),
  updateWebhook: jest.fn(),
  deleteWebhook: jest.fn(),
  getWebhook: jest.fn(),
  listWebhooks: jest.fn(),
  testWebhook: jest.fn(),
  verifySignature: jest.fn(),
  getDeliveryHistory: jest.fn(),
  getWebhookStats: jest.fn(),
  getQueueStats: jest.fn(),
  close: jest.fn(),
};

// Export all mocks
export const mocks = {
  jwtService: mockJwtService,
  apiKeyService: mockApiKeyService,
  eventBus: mockEventBus,
  webSocketService: mockWebSocketService,
  webhookService: mockWebhookService,
};