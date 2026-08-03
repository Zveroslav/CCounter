import request from 'supertest';
import app from '../src/index';

describe('HTTPS Security & Redirect Middleware', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalEnforce = process.env.ENFORCE_HTTPS;

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.ENFORCE_HTTPS = originalEnforce;
  });

  it('should redirect HTTP requests to HTTPS when ENFORCE_HTTPS=true in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ENFORCE_HTTPS = 'true';

    const res = await request(app)
      .get('/protected')
      .set('x-forwarded-proto', 'http');

    expect(res.status).toBe(301);
    expect(res.headers.location).toMatch(/^https:\/\//);
  });

  it('should allow request through if x-forwarded-proto is https', async () => {
    process.env.NODE_ENV = 'production';
    process.env.ENFORCE_HTTPS = 'true';

    const res = await request(app)
      .get('/protected')
      .set('x-forwarded-proto', 'https');

    expect(res.status).toBe(401); // 401 Unauthorized because no token, NOT 301 Redirect
  });
});
