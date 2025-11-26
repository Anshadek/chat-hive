// src/modules/call/call.model.js
import mongoose from 'mongoose';

const CallSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true },
  caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  callee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['audio', 'video'], required: true },
  status: { type: String, enum: ['ringing','connected','rejected','missed','ended'], default: 'ringing' },
  startedAt: { type: Date },
  endedAt: { type: Date },
  durationSeconds: { type: Number, default: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed }, // store offer/answer summary if needed
}, { timestamps: true });

export default mongoose.model('Call', CallSchema);
