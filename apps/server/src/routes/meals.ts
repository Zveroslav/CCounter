import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import { recognizeMeal, getJobStatus, updateMeal, deleteMeal, reanalyzeMeal } from '../controllers/mealsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Configure multer to store files temporarily
const upload = multer({ dest: os.tmpdir() });

router.use(authenticate);

router.post('/recognize', upload.single('image'), recognizeMeal);
router.get('/jobs/:id', getJobStatus);
router.put('/:id', updateMeal);
router.delete('/:id', deleteMeal);
router.post('/:id/reanalyze', reanalyzeMeal);

export default router;
