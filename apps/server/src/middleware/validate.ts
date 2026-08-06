import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './error';

export interface RequestValidationSchema {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

const updateRequestProperty = (req: Request, key: 'body' | 'query' | 'params', value: any) => {
  Object.defineProperty(req, key, {
    value,
    writable: true,
    configurable: true,
    enumerable: true,
  });
};

export const validateRequest = (
  schema: RequestValidationSchema | ZodSchema
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if ('parseAsync' in schema || 'parse' in schema) {
        // Combined Zod schema validating req object shape { body, query, params }
        const parsed = await (schema as ZodSchema).parseAsync({
          body: req.body,
          query: req.query,
          params: req.params,
        });

        if (parsed && typeof parsed === 'object') {
          if ('body' in parsed) updateRequestProperty(req, 'body', parsed.body);
          if ('query' in parsed) updateRequestProperty(req, 'query', parsed.query);
          if ('params' in parsed) updateRequestProperty(req, 'params', parsed.params);
        }
      } else {
        // Container object specifying body, query, and/or params schemas
        const targets = schema as RequestValidationSchema;

        if (targets.params) {
          try {
            const parsedParams = await targets.params.parseAsync(req.params);
            updateRequestProperty(req, 'params', parsedParams);
          } catch (err) {
            if (err instanceof ZodError) {
              const formatted = err.issues.map((i) => ({
                path: i.path.length ? `params.${i.path.join('.')}` : 'params',
                message: i.message,
              }));
              return next(new AppError('Validation error', 400, formatted));
            }
            throw err;
          }
        }
        if (targets.query) {
          try {
            const parsedQuery = await targets.query.parseAsync(req.query);
            updateRequestProperty(req, 'query', parsedQuery);
          } catch (err) {
            if (err instanceof ZodError) {
              const formatted = err.issues.map((i) => ({
                path: i.path.length ? `query.${i.path.join('.')}` : 'query',
                message: i.message,
              }));
              return next(new AppError('Validation error', 400, formatted));
            }
            throw err;
          }
        }
        if (targets.body) {
          try {
            const parsedBody = await targets.body.parseAsync(req.body);
            updateRequestProperty(req, 'body', parsedBody);
          } catch (err) {
            if (err instanceof ZodError) {
              const formatted = err.issues.map((i) => ({
                path: i.path.length ? `body.${i.path.join('.')}` : 'body',
                message: i.message,
              }));
              return next(new AppError('Validation error', 400, formatted));
            }
            throw err;
          }
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        return next(new AppError('Validation error', 400, formattedErrors));
      }
      return next(error);
    }
  };
};
