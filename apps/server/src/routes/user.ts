import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { updateProfileSchema, logWeightSchema } from '../schemas';
import { getProfile, updateProfile, logWeight } from '../controllers/userController';

const router = Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.put('/profile', validateRequest({ body: updateProfileSchema }), updateProfile);
router.post('/weight', validateRequest({ body: logWeightSchema }), logWeight);

export default router;
