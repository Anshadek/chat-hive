import express from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import MessageRequest from '../modules/message-request/messageRequest.routes.js';
import Call from '../modules/call/call.routes.js';
import uploadRoutes from '../modules/uploads/upload.routes.js';
import chatRoutes from '../modules/chat/chat.routes.js';
const router = express.Router();

router.use('/auth', authRoutes);
router.use('/message-request', MessageRequest);
router.use('/call', Call);
router.use('/upload', uploadRoutes);
router.use('/chat', chatRoutes);
export default router;
