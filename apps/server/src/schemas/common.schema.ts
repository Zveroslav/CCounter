import { z } from 'zod';

/** Safely normalizes string inputs to lowercase if value is a string. */
export const toLowerCasePreprocess = (val: unknown) =>
  typeof val === 'string' ? val.toLowerCase() : val;

/** Safely trims string inputs if value is a string. */
export const trimPreprocess = (val: unknown) =>
  typeof val === 'string' ? val.trim() : val;

/** Schema for routes expecting a UUID parameter named id. */
export const uuidParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid UUID format' }),
});
