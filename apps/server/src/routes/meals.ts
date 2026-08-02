import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import { recognizeMeal, getJobStatus } from '../controllers/mealsController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Configure multer to store files temporarily
const upload = multer({ dest: os.tmpdir() });

router.use(authenticate);

router.post('/recognize', upload.single('image'), recognizeMeal);
router.get('/jobs/:id', getJobStatus);

export default router;
