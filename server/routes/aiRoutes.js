import express from "express";
import rateLimit from "express-rate-limit";

import { chatWithAi } from "../controllers/aiController.js";
import { aiChatValidator } from "../validators/aiValidator.js";
import validate from "../middleware/validate.js";

const router = express.Router();

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: "Too many AI requests, please try again later",
  },
});

router.post(
  "/chat",
  aiLimiter,
  aiChatValidator,
  validate,
  chatWithAi
);

export default router;