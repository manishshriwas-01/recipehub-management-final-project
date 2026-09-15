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
import { parseRecipeFields } from '../middleware/parseRecipeFields.js';

import upload from '../middleware/uploadMiddleware.js';

import {
    addFavorite,
    removeFavorite,
    getFavorites
} from '../controllers/favoriteController.js';

import {
    createRecipeValidator,
    updateRecipeValidator
} from '../validators/recipeValidator.js';

import validate from '../middleware/validate.js';


const router = express.Router();


// Create Recipe
router.post(
    '/',
    authMiddleware,
    upload.single('image'),
    parseRecipeFields,
    createRecipeValidator,
    validate,
    createRecipe
);


// Get Current User's Recipes
router.get(
    '/my-recipes',
    authMiddleware,
    getMyRecipes
);


// Get Favorites
router.get(
    '/favorites',
    authMiddleware,
    getFavorites
);


// Get Single Recipe
router.get(
    '/:id',
    getRecipe
);


// Get All Recipes
router.get(
    '/',
    getRecipes
);


// Add Favorite
router.post(
    '/:id/favorite',
    authMiddleware,
    addFavorite
);


// Remove Favorite
router.delete(
    '/:id/favorite',
    authMiddleware,
    removeFavorite
);


// Update Recipe
router.put(
    '/:id',
    authMiddleware,
    upload.single('image'),
    parseRecipeFields,
    updateRecipeValidator,
    validate,
    updateRecipe
);


// Delete Recipe
router.delete(
    '/:id',
    authMiddleware,
    deleteRecipe
);


export default router;