import { body } from "express-validator";

export const appointmentValidator = [
  body("recipeId")
    .trim()
    .notEmpty()
    .withMessage("Recipe ID is required")
    .isMongoId()
    .withMessage("Invalid recipe ID"),

  body("date")
    .trim()
    .notEmpty()
    .withMessage("Date is required")
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage("Date must be in YYYY-MM-DD format"),

  body("startTime")
    .trim()
    .notEmpty()
    .withMessage("Start time is required")
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Start time must be in HH:MM format"),
];