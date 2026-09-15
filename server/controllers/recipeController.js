import Recipe from '../models/Recipe.js';
import User from '../models/User.js';

export const createRecipe = async (req, res, next) => {
    try {
        const { title, ingredients, steps, category } = req.body;

        const recipe = await Recipe.create({
            owner: req.user.userId,
            title,
            imageUrl: `/uploads/${req.file.filename}`,
            ingredients,
            steps,
            category
        });

        return res.status(201).json({
            success: true,
            message: "Recipe created successfully",
            recipe,
        });
    } catch (error) {
        next(error);
    }
};


export const getRecipes = async (req, res, next) => {
    try {
        const {
            search,
            category,
            ownerEmail,
            page = 1,
            limit = 9,
        } = req.query;

        // Validate pagination
        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (!Number.isInteger(pageNumber) || pageNumber < 1) {
            return res.status(400).json({
                success: false,
                message: "Page must be a positive integer",
            });
        }

        if (!Number.isInteger(limitNumber) || limitNumber < 1) {
            return res.status(400).json({
                success: false,
                message: "Limit must be a positive integer",
            });
        }

        // Prevent excessively large requests
        const safeLimit = Math.min(limitNumber, 50);

        const filter = {};

        // Escape special regex characters
        const escapeRegex = (text) => {
            return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        };

        // Search by recipe title
        if (search) {
            const safeSearch = escapeRegex(search);

            const searchRegex = new RegExp(safeSearch, "i");

            filter.title = {
                $regex: searchRegex,
            };
        }

        // Filter by category
        if (category) {
            filter.category = category;
        }

        // Filter by user email
        if (ownerEmail) {
            const user = await User.findOne({
                email: ownerEmail,
            });

            if (!user) {
                return res.status(200).json({
                    success: true,
                    count: 0,
                    total: 0,
                    page: pageNumber,
                    pages: 0,
                    recipes: [],
                });
            }

            filter.owner = user._id;
        }

        const skip = (pageNumber - 1) * safeLimit;

        const recipes = await Recipe.find(filter)
            .populate("owner", "name email")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(safeLimit);

        const totalRecipes =
            await Recipe.countDocuments(filter);

        return res.status(200).json({
            success: true,
            count: recipes.length,
            total: totalRecipes,
            page: pageNumber,
            pages: Math.ceil(totalRecipes / safeLimit),
            recipes,
        });

    } catch (error) {
        next(error);
    }
};

export const getRecipe = async (req, res, next) => {
    try {
        const { id } = req.params;

        const recipe = await Recipe.findById(id)
            .populate("owner", "name email");

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found",
            });
        }

        return res.status(200).json({
            success: true,
            recipe,
        });
    } catch (error) {
        next(error);
    }
};

export const updateRecipe = async (req, res, next) => {
    try {
        const { id } = req.params;

        const {
            title,
            ingredients,
            steps,
            category,
        } = req.body;

        const recipe = await Recipe.findById(id);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found",
            });
        }

        const isOwner =
            recipe.owner.toString() === req.user.userId;

        const isAdmin =
            req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this recipe",
            });
        }

        recipe.title = title ?? recipe.title;

        if (ingredients) {
            recipe.ingredients = ingredients;
        }

        if (steps) {
            recipe.steps = steps;
        }

        recipe.category = category ?? recipe.category;

        // New image selected
        if (req.file) {
            recipe.imageUrl = `/uploads/${req.file.filename}`;
        }

        await recipe.save();

        return res.status(200).json({
            success: true,
            message: "Recipe updated successfully",
            recipe,
        });

    } catch (error) {
        next(error);
    }
};
export const deleteRecipe = async (req, res, next) => {
    try {
        const { id } = req.params;

        const recipe = await Recipe.findById(id);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found",
            });
        }

        const isOwner =
            recipe.owner.toString() === req.user.userId;

        const isAdmin =
            req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this recipe",
            });
        }

        await Recipe.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Recipe deleted successfully",
        });

    } catch (error) {
        next(error);
    }
};


export const getMyRecipes = async (req, res, next) => {
    try {
        const recipes = await Recipe.find({
            owner: req.user.userId,
        })
            .populate("owner", "name email")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: recipes.length,
            recipes,
        });
    } catch (error) {
        next(error);
    }
};