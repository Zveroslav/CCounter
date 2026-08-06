import { Router } from 'express';
import { handleChat } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../middleware/validate';
import { chatSchema } from '../schemas';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest({ body: chatSchema }), handleChat);

export default router;
