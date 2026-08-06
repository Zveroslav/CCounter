import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateRequest } from './validate';
import { AppError } from './error';

describe('validateRequest Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFunction: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: {},
      query: {},
      params: {},
    };
    mockRes = {};
    nextFunction = jest.fn();
  });

  it('should call next() with valid body, query, and params data', async () => {
    const schema = {
      body: z.object({ name: z.string() }),
      query: z.object({ page: z.coerce.number() }),
      params: z.object({ id: z.string().uuid() }),
    };

    mockReq.body = { name: 'Alice' };
    mockReq.query = { page: '2' };
    mockReq.params = { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' };

    const middleware = validateRequest(schema);
    await middleware(mockReq as Request, mockRes as Response, nextFunction as NextFunction);

    expect(nextFunction).toHaveBeenCalledWith();
    expect(mockReq.query).toEqual({ page: 2 });
    expect(mockReq.body).toEqual({ name: 'Alice' });
  });

  it('should call next(AppError) with status 400 and exact error structure when body validation fails', async () => {
    const schema = {
      body: z.object({ calories: z.number() }),
    };

    mockReq.body = { calories: 'invalid' };

    const middleware = validateRequest(schema);
    await middleware(mockReq as Request, mockRes as Response, nextFunction as NextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    const err = nextFunction.mock.calls[0][0];

    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('Validation error');
    expect(err.errors).toEqual([
      {
        path: 'body.calories',
        message: expect.any(String),
      },
    ]);
  });

  it('should call next(AppError) when query validation fails', async () => {
    const schema = {
      query: z.object({ period: z.enum(['day', 'week']) }),
    };

    mockReq.query = { period: 'year' };

    const middleware = validateRequest(schema);
    await middleware(mockReq as Request, mockRes as Response, nextFunction as NextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    const err = nextFunction.mock.calls[0][0];

    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.errors).toHaveLength(1);
    expect(err.errors[0].path).toBe('query.period');
  });

  it('should call next(AppError) when params validation fails (e.g. malformed UUID)', async () => {
    const schema = {
      params: z.object({ id: z.string().uuid() }),
    };

    mockReq.params = { id: 'not-a-uuid' };

    const middleware = validateRequest(schema);
    await middleware(mockReq as Request, mockRes as Response, nextFunction as NextFunction);

    expect(nextFunction).toHaveBeenCalledTimes(1);
    const err = nextFunction.mock.calls[0][0];

    expect(err).toBeInstanceOf(AppError);
    expect(err.statusCode).toBe(400);
    expect(err.errors[0].path).toBe('params.id');
  });

  it('should work with a single unified Zod schema', async () => {
    const schema = z.object({
      body: z.object({ title: z.string() }),
      params: z.object({ id: z.string().uuid() }),
    });

    mockReq.body = { title: 'Lunch' };
    mockReq.params = { id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' };

    const middleware = validateRequest(schema);
    await middleware(mockReq as Request, mockRes as Response, nextFunction as NextFunction);

    expect(nextFunction).toHaveBeenCalledWith();
    expect(mockReq.body).toEqual({ title: 'Lunch' });
  });
});
