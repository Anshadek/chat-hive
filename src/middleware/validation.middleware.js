import { error } from "../utils/apiResponse.js";

export const validate = (schema) => {
    return (req, res, next) => {
        const { error: validationError } = schema.validate(req.body);
        if (validationError) {
            return error(res, validationError.details[0].message, 400);
        }
        next();
    };
};
