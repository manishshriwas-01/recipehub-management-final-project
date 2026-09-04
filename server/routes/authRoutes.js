import express from "express";
import { login, register,getMe, deleteMyAccount } from "../controllers/authController.js"
import { registerValidator } from "../validators/authValidator.js";
import validate from "../middleware/validate.js";
import { loginValidator } from "../validators/loginValidator.js";
import authMiddleware from "../middleware/authMiddleware.js";


const router=express.Router();

router.post('/register',registerValidator,validate,register);
router.post('/login',loginValidator,validate,login);
router.get('/me',authMiddleware,getMe);
router.delete('/me',authMiddleware,deleteMyAccount);

export default router;