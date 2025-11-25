import express from "express";
import { MessageRequestController } from "./messageRequest.controller.js";
import authMiddleware from "../../middleware/auth.middleware.js";
import { validateRequest } from "./messageRequest.validation.js";
import { validate } from "../../middleware/validation.middleware.js";
import { validateObjectId } from "../../middleware/validateObjectId.middleware.js";
const router = express.Router();

router.post("/send",authMiddleware, validate(validateRequest), MessageRequestController.send);
router.get("/pending-list",authMiddleware,MessageRequestController.pendingList);
router.get("/accepted-list",authMiddleware,MessageRequestController.acceptedList);
router.get("/rejected-list",authMiddleware,MessageRequestController.rejectedList);
router.put("/accept/:id", [authMiddleware, validateObjectId], MessageRequestController.accept);
router.put("/reject/:id", [authMiddleware, validateObjectId], MessageRequestController.reject);

export default router;
