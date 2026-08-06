import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { getJournalQuerySchema, updateUserNoteSchema } from '../schemas';
import { getJournalData, updateUserNote } from '../controllers/journalController';

const router = Router();

router.use(authenticate);

router.get('/', validateRequest({ query: getJournalQuerySchema }), getJournalData);
router.post('/note', validateRequest({ body: updateUserNoteSchema }), updateUserNote);

export default router;
