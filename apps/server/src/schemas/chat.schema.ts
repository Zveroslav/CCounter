import { z } from 'zod';
import { toLowerCasePreprocess } from './common.schema';

export const chatSchema = z.object({
  message: z.string().min(1, { message: 'message and period are required' }),
  period: z.preprocess(
    toLowerCasePreprocess,
    z.enum(['day', 'week', 'month', 'all-time'])
  ),
  targetDate: z.string().optional(),
});
