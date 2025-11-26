// src/modules/chat/chat.service.js
import Message from './chat.model.js';
import mongoose from 'mongoose';

export const createMessage = async (payload) => {
  // payload: { roomId, from, to, type, message, meta }
  return Message.create(payload);
};

export const listMessages = async ({ roomId, limit = 50, before }) => {
  const q = { roomId };
  if (before) q.createdAt = { $lt: new Date(before) };
  const msgs = await Message.find(q)
    .sort({ createdAt: -1 })
    .limit(Number(limit))
    .populate('from', 'name email')
    .populate('to', 'name email')
    .lean();
  return msgs.reverse(); // return oldest -> newest
};

export const markAsDelivered = (roomId, messageIds = []) =>
  Message.updateMany({ _id: { $in: messageIds } }, { $set: { delivered: true } });

export const markAsRead = (roomId, messageIds = []) =>
  Message.updateMany({ _id: { $in: messageIds } }, { $set: { read: true } });

export const deleteMessage = (messageId) => Message.findByIdAndDelete(messageId);
