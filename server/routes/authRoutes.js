import express from "express";

import {
  login,
  register,
  getMe,
  getAllUsers,
  deleteUserByAdmin,
} from "../controllers/authController.js";

import { registerValidator } from "../validators/authValidator.js";
import validate from "../middleware/validate.js";
import { loginValidator } from "../validators/loginValidator.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  registerValidator,
  validate,
  register
);

router.post(
  "/login",
  loginValidator,
  validate,
  login
);

router.get(
  "/me",
  authMiddleware,
  getMe
);



// Admin routes
router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  getAllUsers
);

router.delete(
  "/users/:id",
  authMiddleware,
  adminMiddleware,
  deleteUserByAdmin
);

export default router;