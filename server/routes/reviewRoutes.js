import express from 'express';
import { createReview ,getReviewsByRecipe,deleteReview,toggleHelpfulReview} from '../controllers/reviewController.js';
import authMiddleware from '../middleware/authMiddleware.js'
import { createReviewValidator } from '../validators/reviewValidator.js';
import validate from "../middleware/validate.js";

const router=express.Router();
router.post(
    "/",
    authMiddleware,
    createReviewValidator,
    validate,
    createReview
);
router.get("/:recipeId", getReviewsByRecipe);
router.delete("/:id", authMiddleware, deleteReview);
router.post("/:id/helpful",
    authMiddleware,
    toggleHelpfulReview)

export default router;