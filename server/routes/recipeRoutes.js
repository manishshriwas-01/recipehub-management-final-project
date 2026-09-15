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

import upload from '../middleware/uploadMiddleware.js';

import {
    addFavorite,
    removeFavorite,
    getFavorites
} from '../controllers/favoriteController.js';


const router = express.Router();


// Create Recipe
router.post(
    '/',
    authMiddleware,
    upload.single('image'),
    createRecipe
);



router.get('/my-recipes', authMiddleware, getMyRecipes);

router.get('/favorites', authMiddleware, getFavorites);


router.get('/:id', getRecipe);



router.get('/', getRecipes);



router.post('/:id/favorite', authMiddleware, addFavorite);

router.delete('/:id/favorite', authMiddleware, removeFavorite);



router.put('/:id', authMiddleware, upload.single('image'), updateRecipe);

router.delete('/:id', authMiddleware, deleteRecipe);


export default router;