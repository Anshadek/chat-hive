// src/modules/chat/chat.routes.js
import express from 'express';
import * as controller from './chat.controller.js';
import authMiddleware from '../../middleware/auth.middleware.js';

const router = express.Router();

router.post('/send', authMiddleware, controller.sendMessage);
router.get('/:roomId', authMiddleware, controller.getMessages);
router.put('/:roomId/read', authMiddleware, controller.markRead);

export default router;
