// src/modules/call/call.routes.js
import express from 'express';
import * as controller from './call.controller.js';
import authMiddleware from '../../middleware/auth.middleware.js';
const router = express.Router();

router.post('/initiate', authMiddleware, controller.initiateCall);
router.post('/status', authMiddleware, controller.updateStatus);
router.get('/list', authMiddleware, controller.getCalls);

export default router;
