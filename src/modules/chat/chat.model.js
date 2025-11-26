// src/modules/chat/chat.model.js
import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true }, // e.g. user1_user2 or generated convo id
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['text','image','audio','system'], default: 'text' },
  message: { type: String }, // text or file URL
  meta: { type: mongoose.Schema.Types.Mixed }, // { filename, size, duration }
  delivered: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

MessageSchema.index({ roomId: 1, createdAt: -1 });

export default mongoose.model('Message', MessageSchema);
