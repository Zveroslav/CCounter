import request from 'supertest';
import app from '../src/index';

describe('Static File Serving & SPA Fallback', () => {
  const originalEnv = process.env.NODE_ENV;

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('should return 401 for unauthenticated /protected route even in production', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
  });

  it('should return 401 for unauthenticated API routes before wildcard fallback', async () => {
    process.env.NODE_ENV = 'production';
    const res = await request(app).get('/api/chat');
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toMatch(/json/);
  });
});
