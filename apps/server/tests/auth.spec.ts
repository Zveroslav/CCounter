import request from 'supertest';
import app from '../src/index';
import jwt from 'jsonwebtoken';

describe('Auth Middleware', () => {
  const secret = process.env.JWT_SECRET || 'test-secret';
  const validToken = jwt.sign({ id: '123', email: 'test@example.com' }, secret);
  
  it('should return 401 if no token is provided', async () => {
    const res = await request(app).get('/protected');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('No token provided');
  });

  it('should return 401 if an invalid token is provided', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalidtoken');
    
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token');
  });

  it('should return 200 and user data if a valid token is provided', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${validToken}`);
    
    expect(res.status).toBe(200);
    expect(res.body.message).toBe('This is a protected route');
    expect(res.body.user.id).toBe('123');
    expect(res.body.user.email).toBe('test@example.com');
  });
});
