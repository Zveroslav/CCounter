import { Router } from 'express';
import { handleChat } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', handleChat);

export default router;
