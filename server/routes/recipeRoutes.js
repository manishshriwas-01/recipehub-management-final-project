import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js';
import { createRecipe, deleteRecipe, getRecipe, getRecipes, updateRecipe } from '../controllers/recipeController.js';

const router=express.Router();

router.post('/',authMiddleware,createRecipe);
router.get('/',getRecipes);
router.get('/:id',getRecipe);
router.put('/:id',authMiddleware,updateRecipe);
router.delete('/:id',authMiddleware,deleteRecipe);

export default router;