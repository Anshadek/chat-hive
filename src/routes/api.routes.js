import express from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import MessageRequest from '../modules/message-request/messageRequest.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/message-request', MessageRequest);

export default router;
