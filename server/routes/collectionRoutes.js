import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  createCollection,
  getMyCollections,
  getCollection,
  updateCollection,
  deleteCollection,
  addRecipeToCollection,
  removeRecipeFromCollection,
  getSharedCollection,
  shareCollection,
unshareCollection,
} from "../controllers/collectionController.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  upload.single("coverImage"),
  createCollection
);

router.get("/", authMiddleware, getMyCollections);

router.get("/shared/:shareToken", getSharedCollection);

router.get("/:id", authMiddleware, getCollection);

router.put("/:id", authMiddleware, updateCollection);

router.delete("/:id", authMiddleware, deleteCollection);

router.post(
  "/:collectionId/recipes/:recipeId",
  authMiddleware,
  addRecipeToCollection
);

router.delete(
  "/:collectionId/recipes/:recipeId",
  authMiddleware,
  removeRecipeFromCollection
);

router.post(
  "/:id/share",
  authMiddleware,
  shareCollection
);

router.delete(
  "/:id/share",
  authMiddleware,
  unshareCollection
);

export default router;