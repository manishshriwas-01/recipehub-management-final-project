import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  getMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  getShoppingList,
} from "../controllers/mealPlanController.js";

const router = express.Router();

router.get("/", authMiddleware, getMealPlans);

router.get(
  "/shopping-list",
  authMiddleware,
  getShoppingList
);

router.post("/", authMiddleware, createMealPlan);

router.patch(
  "/:id",
  authMiddleware,
  updateMealPlan
);

router.delete(
  "/:id",
  authMiddleware,
  deleteMealPlan
);

export default router;