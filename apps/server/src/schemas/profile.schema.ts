import { z } from 'zod';
import { trimPreprocess, toLowerCasePreprocess } from './common.schema';

export const updateProfileSchema = z.object({
  name: z.preprocess(trimPreprocess, z.string().optional()),
  timezone: z.preprocess(trimPreprocess, z.string().optional()),
  targetCalories: z.coerce.number().int().positive().optional(),
  targetProteinPct: z.coerce.number().nonnegative().max(100).optional(),
  targetFatPct: z.coerce.number().nonnegative().max(100).optional(),
  targetCarbsPct: z.coerce.number().nonnegative().max(100).optional(),
});

export const logWeightSchema = z.object({
  weight: z.coerce.number().positive({ message: 'Weight is required' }),
});
