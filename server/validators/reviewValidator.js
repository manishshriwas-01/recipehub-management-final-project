import { body } from "express-validator";

export const createReviewValidator = [
    body("recipeId")
        .notEmpty()
        .withMessage("Recipe ID is required")
        .isMongoId()
        .withMessage("Invalid recipe ID"),

    body("rating")
        .notEmpty()
        .withMessage("Rating is required")
        .isInt({ min: 1, max: 5 })
        .withMessage("Rating must be between 1 and 5"),

    body("comment")
        .trim()
        .notEmpty()
        .withMessage("Review is required")
        .isLength({ min: 3, max: 1000 })
        .withMessage("Review must be between 3 and 1000 characters"),
];