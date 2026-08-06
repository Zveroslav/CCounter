import { z } from 'zod';

export const updateMealSchema = z.object({
  title: z.string().optional(),
  calories: z.coerce.number().int().nonnegative().optional(),
  protein: z.coerce.number().nonnegative().optional(),
  fat: z.coerce.number().nonnegative().optional(),
  carbs: z.coerce.number().nonnegative().optional(),
  recognizedText: z.string().optional(),
});

export const reanalyzeMealSchema = z.object({
  prompt: z.string().min(1, { message: 'Prompt is required' }),
});
