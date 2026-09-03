
import { body } from "express-validator";

export const createRecipeValidator = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("ingredients")
    .isArray({ min: 1 })
    .withMessage("Ingredients must be a non-empty array"),

  body("ingredients.*")
    .trim()
    .notEmpty()
    .withMessage("Ingredient cannot be empty"),

  body("steps")
    .isArray({ min: 1 })
    .withMessage("Steps must be a non-empty array"),

  body("steps.*")
    .trim()
    .notEmpty()
    .withMessage("Step cannot be empty"),

  body("category")
    .trim()
    .notEmpty()
    .withMessage("Category is required")
    .isIn([
      "Indian",
      "Italian",
      "Chinese",
      "Mexican",
      "Dessert",
      "Healthy",
      "Breakfast",
      "Other",
    ])
    .withMessage("Invalid category"),
];

export const updateRecipeValidator = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters"),

  body("ingredients")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Ingredients must be a non-empty array"),

  body("ingredients.*")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Ingredient cannot be empty"),

  body("steps")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Steps must be a non-empty array"),

  body("steps.*")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Step cannot be empty"),

  body("category")
    .optional()
    .trim()
    .isIn([
      "Indian",
      "Italian",
      "Chinese",
      "Mexican",
      "Dessert",
      "Healthy",
      "Breakfast",
      "Other",
    ])
    .withMessage("Invalid category"),
];

