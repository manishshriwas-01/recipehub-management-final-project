import express from 'express';

import authMiddleware from '../middleware/authMiddleware.js';

import {
    createRecipe,
    deleteRecipe,
    getRecipe,
    getRecipes,
    getMyRecipes,
    updateRecipe
} from '../controllers/recipeController.js';

import {
    addFavorite,
    removeFavorite,
    getFavorites
} from '../controllers/favoriteController.js';


const router = express.Router();

router.post('/', authMiddleware, createRecipe);

router.get('/', getRecipes);

router.get('/my-recipes', authMiddleware, getMyRecipes);

router.get('/favorites', authMiddleware, getFavorites);

router.post('/:id/favorite', authMiddleware, addFavorite);

router.delete('/:id/favorite', authMiddleware, removeFavorite);

router.get('/:id', getRecipe);

router.put('/:id', authMiddleware, updateRecipe);

router.delete('/:id', authMiddleware, deleteRecipe);

export default router;