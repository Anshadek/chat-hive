// src/modules/call/call.controller.js
import * as callService from './call.service.js';
import { success, error } from "../../utils/apiResponse.js";

export const initiateCall = async (req, res, next) => {
  try {
    const { calleeId, type } = req.body;
    const callerId = req.user._id; // assuming auth middleware sets req.user
    const call = await callService.createCall({ caller: callerId, callee: calleeId, type });

    return success(res, call, 'Call initiated');
  } catch (err) { next(err); }
};

export const updateStatus = async (req, res, next) => {
  try {
    const { roomId, status } = req.body;
    const call = await callService.updateCallStatus(roomId, status);
    return success(res, call, 'Status updated');
  } catch (err) { next(err); }
};

export const getCalls = async (req, res, next) => {
  try {
    const calls = await callService.listCallsForUser(req.user._id);
    return success(res, calls);
  } catch (err) { next(err); }
};
