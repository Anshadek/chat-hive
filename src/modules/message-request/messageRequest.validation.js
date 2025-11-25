import Joi from "joi";

export const validateRequest = Joi.object({
    receiver: Joi.string().required(),
});
