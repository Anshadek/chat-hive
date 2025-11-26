// src/modules/chat/chat.controller.js
import * as chatService from './chat.service.js';
import { success, error } from '../../utils/apiResponse.js';

export const sendMessage = async (req, res, next) => {
  try {
    const { roomId, to, type, message, meta } = req.body;
    const from = req.user._id;
    const msg = await chatService.createMessage({ roomId, from, to, type, message, meta });
    return success(res, msg, 'Message saved');
  } catch (err) { next(err); }
};

export const getMessages = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, before } = req.query;
    const msgs = await chatService.listMessages({ roomId, limit, before });
    return success(res, msgs);
  } catch (err) { next(err); }
};

export const markRead = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { messageIds } = req.body;
    await chatService.markAsRead(roomId, messageIds);
    return success(res, null, 'Marked as read');
  } catch (err) { next(err); }
};
