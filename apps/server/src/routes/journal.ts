import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getJournalData } from '../controllers/journalController';

const router = Router();

router.use(authenticate);

router.get('/', getJournalData);

export default router;
