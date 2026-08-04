import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getJournalData, updateUserNote } from '../controllers/journalController';

const router = Router();

router.use(authenticate);

router.get('/', getJournalData);
router.post('/note', updateUserNote);

export default router;
