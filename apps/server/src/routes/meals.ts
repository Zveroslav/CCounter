import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import { recognizeMeal, getJobStatus, updateMeal, deleteMeal, reanalyzeMeal } from '../controllers/mealsController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { uuidParamSchema, updateMealSchema, reanalyzeMealSchema } from '../schemas';

const router = Router();

// Configure multer to store files temporarily
const upload = multer({ dest: os.tmpdir() });

router.use(authenticate);

router.post('/recognize', upload.single('image'), recognizeMeal);
router.get('/jobs/:id', validateRequest({ params: uuidParamSchema }), getJobStatus);
router.put('/:id', validateRequest({ params: uuidParamSchema, body: updateMealSchema }), updateMeal);
router.delete('/:id', validateRequest({ params: uuidParamSchema }), deleteMeal);
router.post('/:id/reanalyze', validateRequest({ params: uuidParamSchema, body: reanalyzeMealSchema }), reanalyzeMeal);

export default router;
