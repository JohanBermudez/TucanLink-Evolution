import request from 'supertest';
import { app } from '../../server';

describe('Health Endpoints Integration Tests', () => {
  describe('GET /api/bridge/v1/health', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/api/bridge/v1/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        environment: 'test',
        version: '1.0.0',
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should not require authentication', async () => {
      const response = await request(app)
        .get('/api/bridge/v1/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
    });

    it('should return correct content type', async () => {
      const response = await request(app)
        .get('/api/bridge/v1/health')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toBeDefined();
    });
  });

  describe('GET /api/bridge/v1/health/ready', () => {
    it('should return ready status when system is ready', async () => {
      const response = await request(app)
        .get('/api/bridge/v1/health/ready')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ready',
        checks: {
          server: true,
        },
      });
      expect(response.body.checks.timestamp).toBeDefined();
    });

    it('should not require authentication', async () => {
      await request(app)
        .get('/api/bridge/v1/health/ready')
        .expect(200);
    });
  });

  describe('GET /api/bridge/v1/health/live', () => {
    it('should return live status', async () => {
      const response = await request(app)
        .get('/api/bridge/v1/health/live')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'live',
      });
      expect(response.body.timestamp).toBeDefined();
    });

    it('should be lightweight and fast', async () => {
      const startTime = Date.now();
      
      await request(app)
        .get('/api/bridge/v1/health/live')
        .expect(200);
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(100); // Should respond in less than 100ms
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/bridge/v1/non-existent-endpoint')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
      });
      expect(response.body.message).toContain('not found');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle different HTTP methods', async () => {
      const methods = ['get', 'post', 'put', 'delete', 'patch'];
      
      for (const method of methods) {
        const response = await (request(app) as any)[method]('/api/bridge/v1/invalid')
          .expect(404);

        expect(response.body.error).toBe('Not Found');
      }
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in response', async () => {
      const response = await request(app)
        .get('/api/bridge/v1/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should handle OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/bridge/v1/health')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/bridge/v1/test')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should respect content-type limits', async () => {
      const largePayload = 'x'.repeat(11 * 1024 * 1024); // 11MB (exceeds 10MB limit)
      
      const response = await request(app)
        .post('/api/bridge/v1/test')
        .send({ data: largePayload })
        .expect(413); // Payload too large

      expect(response.status).toBe(413);
    });
  });

  describe('Compression', () => {
    it('should compress large responses', async () => {
      // Create a mock endpoint that returns large data
      app.get('/api/bridge/v1/test/large', (_req, res) => {
        const largeData = {
          data: Array(1000).fill('This is a test string that will be repeated many times.'),
        };
        res.json(largeData);
      });

      const response = await request(app)
        .get('/api/bridge/v1/test/large')
        .set('Accept-Encoding', 'gzip, deflate')
        .expect(200);

      // Check if response is compressed
      expect(response.headers['content-encoding']).toBeDefined();
    });
  });

  describe('Security Headers', () => {
    it('should include security headers', async () => {
      const response = await request(app)
        .get('/api/bridge/v1/health')
        .expect(200);

      // Helmet security headers
      expect(response.headers['x-dns-prefetch-control']).toBeDefined();
      expect(response.headers['x-frame-options']).toBeDefined();
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });
});