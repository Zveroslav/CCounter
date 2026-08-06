import { z } from 'zod';
import { toLowerCasePreprocess } from './common.schema';

export const getJournalQuerySchema = z.object({
  period: z.preprocess(
    toLowerCasePreprocess,
    z.enum(['day', 'week', 'month', 'all-time']).optional().default('day')
  ),
  date: z.string().optional(),
});

export const updateUserNoteSchema = z.object({
  period: z.preprocess(
    toLowerCasePreprocess,
    z.enum(['day', 'week', 'month'])
  ),
  date: z.string().min(1, { message: 'Date is required' }),
  text: z.string().optional(),
});
