import express from "express";
import { AuthController } from "./auth.controller.js";
import { validateRegister, validateLogin } from "./auth.validation.js";
import { validate } from "../../middleware/validation.middleware.js";

const router = express.Router();

router.post("/register", validate(validateRegister), AuthController.register);

router.post("/login", validate(validateLogin), AuthController.login);

export default router;
