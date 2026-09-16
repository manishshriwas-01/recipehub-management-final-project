import { body } from "express-validator";

export const aiChatValidator = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 1000 })
    .withMessage("Message must not exceed 1000 characters"),
];