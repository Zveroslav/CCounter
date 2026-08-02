import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getProfile, updateProfile, logWeight } from '../controllers/userController';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/weight', logWeight);

export default router;
