// src/modules/chat/chat.validation.js
import Joi from 'joi';

export const sendMessageSchema = Joi.object({
  roomId: Joi.string().required(),
  to: Joi.string().required(),
  type: Joi.string().valid('text','image','audio','system').required(),
  message: Joi.string().allow('', null),
  meta: Joi.any()
});
