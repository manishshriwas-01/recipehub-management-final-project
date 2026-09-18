import express from "express";

import {
    createAvailability,
    getRecipeAvailability,
    getMyAvailability,
    updateAvailability,
    deleteAvailability
} from "../controllers/availabilityController.js";

import authMiddleware from "../middleware/authMiddleware.js";

import { availabilityValidator } from "../validators/availabilityValidator.js";
import validate from "../middleware/validate.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
    availabilityValidator,
    validate,
    createAvailability
);

router.get(
    "/recipe/:recipeId",
    getRecipeAvailability
);
router.get(
    "/my",
    authMiddleware,
    getMyAvailability
);
router.patch("/:id",authMiddleware,updateAvailability);
router.delete('/:id',authMiddleware,deleteAvailability);
export default router;