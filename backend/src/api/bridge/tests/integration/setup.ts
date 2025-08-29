import request from 'supertest';
import { app, httpServer } from '../../server';
import { jwtService } from '../../v1/services/auth/jwt.service';

// Test database connection
export const testDb = {
  connect: async () => {
    // In production, connect to test database
    console.log('Connected to test database');
  },
  disconnect: async () => {
    // In production, disconnect from test database
    console.log('Disconnected from test database');
  },
  clear: async () => {
    // In production, clear test data
    console.log('Test database cleared');
  },
};

// Test Redis connection
export const testRedis = {
  connect: async () => {
    // In production, connect to test Redis
    console.log('Connected to test Redis');
  },
  disconnect: async () => {
    // In production, disconnect from test Redis
    console.log('Disconnected from test Redis');
  },
  clear: async () => {
    // In production, clear test Redis data
    console.log('Test Redis cleared');
  },
};

// Test helpers
export const testHelpers = {
  // Generate test JWT token
  generateTestToken: (payload = {}) => {
    return jwtService.generateAccessToken({
      userId: 1,
      companyId: 1,
      email: 'test@example.com',
      profile: 'admin',
      ...payload,
    });
  },

  // Generate test API key
  generateTestApiKey: () => {
    return 'tlk_test_api_key_12345678901234567890';
  },

  // Create authenticated request
  authRequest: (method: 'get' | 'post' | 'put' | 'delete', path: string) => {
    const token = testHelpers.generateTestToken();
    return request(app)[method](path)
      .set('Authorization', `Bearer ${token}`)
      .set('Accept', 'application/json');
  },

  // Create API key authenticated request
  apiKeyRequest: (method: 'get' | 'post' | 'put' | 'delete', path: string) => {
    const apiKey = testHelpers.generateTestApiKey();
    return request(app)[method](path)
      .set('X-API-Key', apiKey)
      .set('Accept', 'application/json');
  },
};

// Global setup for integration tests
export const setupIntegrationTests = async () => {
  await testDb.connect();
  await testRedis.connect();
};

// Global teardown for integration tests
export const teardownIntegrationTests = async () => {
  await testDb.clear();
  await testRedis.clear();
  await testDb.disconnect();
  await testRedis.disconnect();
  
  // Close HTTP server
  await new Promise<void>((resolve) => {
    httpServer.close(() => resolve());
  });
};

// Export supertest app for testing
export const testApp = request(app);