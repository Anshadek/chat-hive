// src/modules/call/call.service.js
import Call from './call.model.js';
import { v4 as uuidv4 } from 'uuid';

export const createCall = async ({ caller, callee, type }) => {
  const roomId = uuidv4();
  const call = await Call.create({ roomId, caller, callee, type, status: 'ringing' });
  return call;
};

export const updateCallStatus = async (roomId, status, extra = {}) => {
  const update = { status, ...extra };
  if (status === 'connected') update.startedAt = new Date();
  if (status === 'ended') update.endedAt = new Date();
  const call = await Call.findOneAndUpdate({ roomId }, update, { new: true });
  if (call && call.startedAt && call.endedAt) {
    call.durationSeconds = Math.round((call.endedAt - call.startedAt) / 1000);
    await call.save();
  }
  return call;
};

export const getCallByRoom = (roomId) => Call.findOne({ roomId });
export const listCallsForUser = (userId, limit = 50) =>
  Call.find({ $or: [{ caller: userId }, { callee: userId }] }).sort({ createdAt: -1 }).limit(limit);
