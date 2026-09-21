import express from "express";
import rateLimit from "express-rate-limit";

import {
  login,
  register,
  getMe,
  getAllUsers,
  deleteUserByAdmin,
} from "../controllers/authController.js";

import { registerValidator } from "../validators/registerValidator.js";
import validate from "../middleware/validate.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { loginValidator } from "../validators/loginValidator.js";


const router = express.Router();


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later",
  },
});


router.post(
  "/register",
  authLimiter,
  registerValidator,
  validate,
  register
);


router.post(
  "/login",
  authLimiter,
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