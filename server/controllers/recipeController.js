import Recipe from '../models/Recipe.js';
import User from '../models/User.js';
import cloudinary from "../config/cloudinary.js";
import Review from '../models/Review.js';
import mongoose from "mongoose";

export const createRecipe = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Recipe image is required",
            });
        }

        const { title, ingredients, steps, category, cookTime } = req.body;

        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "recipehub",
                    resource_type: "image",
                },
                (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                }
            );

            uploadStream.end(req.file.buffer);
        });

        const recipe = await Recipe.create({
            owner: req.user.userId,
            title,
            imageUrl: uploadResult.secure_url,
            ingredients,
            steps,
            category,
            cookTime
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
            ownerId,
            maxCookTime,
            minRating,
            sort = "newest",
            ingredients,
            page = 1,
            limit = 9,
        } = req.query;

        // ========================================
        // VALIDATE PAGINATION
        // ========================================

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

        const safeLimit = Math.min(limitNumber, 50);

        // ========================================
        // BASE FILTER
        // ========================================

        const filter = {};

        // Escape special regex characters
        const escapeRegex = (text) => {
            return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        };

        // ========================================
        // SEARCH
        // ========================================

        if (search) {
            const trimmedSearch = search.trim();

            if (mongoose.Types.ObjectId.isValid(trimmedSearch)) {
                filter._id = trimmedSearch;
            } else {
                filter.$text = {
                    $search: trimmedSearch,
                };
            }
        }

        // ========================================
        // CATEGORY
        // ========================================

        if (category) {
            filter.category = category;
        }

        // ========================================
        // OWNER
        // ========================================

        if (ownerId) {
            filter.owner = ownerId;
        }

        // ========================================
        // INGREDIENTS
        // ========================================

        if (ingredients) {
            const ingredientList = ingredients
                .split(',')
                .map(item => item.trim())
                .filter(Boolean);

            if (ingredientList.length > 0) {
                filter.ingredients = {
                    $all: ingredientList.map(
                        ingredient =>
                            new RegExp(
                                escapeRegex(ingredient),
                                'i'
                            )
                    ),
                };
            }
        }

        // ========================================
        // MAX COOK TIME
        // ========================================

        if (maxCookTime) {
            const cookTime = Number(maxCookTime);

            if (!Number.isFinite(cookTime) || cookTime < 1) {
                return res.status(400).json({
                    success: false,
                    message: "maxCookTime must be a positive number",
                });
            }

            filter.cookTime = {
                $lte: cookTime,
            };
        }

        // ========================================
        // MINIMUM RATING
        // ========================================

        let rating;

        if (minRating) {
            rating = Number(minRating);

            if (
                !Number.isFinite(rating) ||
                rating < 1 ||
                rating > 5
            ) {
                return res.status(400).json({
                    success: false,
                    message: "minRating must be a number between 1 and 5",
                });
            }
        }

        // ========================================
        // SORT VALIDATION
        // ========================================

        const allowedSorts = [
            "newest",
            "rating",
            "reviews",
            "cookTime",
        ];

        if (!allowedSorts.includes(sort)) {
            return res.status(400).json({
                success: false,
                message: `Invalid sort option. Allowed values: ${allowedSorts.join(", ")}`,
            });
        }

        // ========================================
        // PAGINATION
        // ========================================

        const skip = (pageNumber - 1) * safeLimit;

        // ========================================
        // REVIEW BASED SORTING
        // ========================================

        if (sort === "rating" || sort === "reviews") {

            const reviewSort =
                sort === "rating"
                    ? { averageRating: -1 }
                    : { reviewCount: -1 };

            const reviewPipeline = [
                {
                    $group: {
                        _id: "$recipe",

                        averageRating: {
                            $avg: "$rating",
                        },

                        reviewCount: {
                            $sum: 1,
                        },
                    },
                },
                {
                    $sort: reviewSort,
                },
            ];

            // Minimum rating filter
            if (rating) {
                reviewPipeline.push({
                    $match: {
                        averageRating: {
                            $gte: rating,
                        },
                    },
                });
            }

            const ratingResults =
                await Review.aggregate(reviewPipeline);

            const recipeIds = ratingResults.map(
                (item) => item._id
            );

            if (recipeIds.length === 0) {
                return res.status(200).json({
                    success: true,
                    count: 0,
                    total: 0,
                    page: pageNumber,
                    pages: 0,
                    recipes: [],
                });
            }

            filter._id = {
                $in: recipeIds,
            };

            const recipes = await Recipe.find(filter)
                .populate("owner", "name");

            // Preserve Review aggregation order
            const recipeMap = new Map(
                recipes.map((recipe) => [
                    recipe._id.toString(),
                    recipe,
                ])
            );

            const sortedRecipes = recipeIds
                .map((id) =>
                    recipeMap.get(id.toString())
                )
                .filter(Boolean);

            const totalRecipes =
                sortedRecipes.length;

            const paginatedRecipes =
                sortedRecipes.slice(
                    skip,
                    skip + safeLimit
                );

            return res.status(200).json({
                success: true,
                count: paginatedRecipes.length,
                total: totalRecipes,
                page: pageNumber,
                pages: Math.ceil(
                    totalRecipes / safeLimit
                ),
                recipes: paginatedRecipes,
            });
        }

        // ========================================
        // NORMAL RECIPE SORTING
        // ========================================

        let sortOption = {
            createdAt: -1,
        };

        if (sort === "cookTime") {
            sortOption = {
                cookTime: 1,
            };
        }

        // ========================================
        // MINIMUM RATING WITHOUT REVIEW SORT
        // ========================================

        if (rating) {

            const ratingResults =
                await Review.aggregate([
                    {
                        $group: {
                            _id: "$recipe",

                            averageRating: {
                                $avg: "$rating",
                            },
                        },
                    },
                    {
                        $match: {
                            averageRating: {
                                $gte: rating,
                            },
                        },
                    },
                ]);

            const recipeIds = ratingResults.map(
                (item) => item._id
            );

            filter._id = {
                $in: recipeIds,
            };
        }

        // ========================================
        // GET RECIPES
        // ========================================

        const recipes = await Recipe.find(filter)
            .populate("owner", "name")
            .sort(sortOption)
            .skip(skip)
            .limit(safeLimit);

        const totalRecipes =
            await Recipe.countDocuments(filter);

        // ========================================
        // RESPONSE
        // ========================================

        return res.status(200).json({
            success: true,
            count: recipes.length,
            total: totalRecipes,
            page: pageNumber,
            pages: Math.ceil(
                totalRecipes / safeLimit
            ),
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
            .populate("owner", "name");

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found",
            });
        }
        const ratingStats = await Review.aggregate([
            {
                $match: {
                    recipe: recipe._id,
                },
            },
            {
                $group: {
                    _id: null,
                    averageRating: { $avg: "$rating" },
                    reviewCount: { $sum: 1 },
                },
            },
        ]);

        const averageRating = ratingStats[0]?.averageRating || 0;
        const reviewCount = ratingStats[0]?.reviewCount || 0;

        return res.status(200).json({
            success: true,
            recipe,
        });
    } catch (error) {
        next(error);
    }
};

// export const updateRecipe = async (req, res, next) => {
//     try {
//         const { id } = req.params;

//         const {
//             title,
//             ingredients,
//             steps,
//             category,
//         } = req.body;

//         const recipe = await Recipe.findById(id);

//         if (!recipe) {
//             return res.status(404).json({
//                 success: false,
//                 message: "Recipe not found",
//             });
//         }

//         const isOwner =
//             recipe.owner.toString() === req.user.userId;

//         const isAdmin =
//             req.user.role === "admin";

//         if (!isOwner && !isAdmin) {
//             return res.status(403).json({
//                 success: false,
//                 message: "You are not authorized to update this recipe",
//             });
//         }

//         recipe.title = title ?? recipe.title;

//         if (ingredients) {
//             recipe.ingredients = ingredients;
//         }

//         if (steps) {
//             recipe.steps = steps;
//         }

//         recipe.category = category ?? recipe.category;

//         // New image selected
//         if (req.file) {
//             recipe.imageUrl = `/uploads/${req.file.filename}`;
//         }

//         await recipe.save();

//         return res.status(200).json({
//             success: true,
//             message: "Recipe updated successfully",
//             recipe,
//         });

//     } catch (error) {
//         next(error);
//     }
// };
export const updateRecipe = async (req, res, next) => {
    try {
        const { id } = req.params;

        const {
            title,
            ingredients,
            steps,
            category,
            cookTime
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

        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this recipe",
            });
        }

        const updateData = {
            title,
            ingredients,
            steps,
            category,
            cookTime
        };

        if (req.file) {
            const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: "recipehub",
                        resource_type: "image",
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );

                uploadStream.end(req.file.buffer);
            });

            updateData.imageUrl = uploadResult.secure_url;
        }

        const updatedRecipe = await Recipe.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true,
            }
        ).populate("owner", "name email");

        return res.status(200).json({
            success: true,
            message: "Recipe updated successfully",
            recipe: updatedRecipe,
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

        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this recipe",
            });
        }

        // Delete image from Cloudinary if it is a Cloudinary URL
        if (recipe.imageUrl?.includes("res.cloudinary.com")) {
            const parts = recipe.imageUrl.split("/");

            const filenameWithExtension = parts.pop();

            const publicId = `recipehub/${filenameWithExtension.split(".")[0]}`;

            await cloudinary.uploader.destroy(publicId);
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



// ========================================
// TRENDING RECIPES
// ========================================

export const getTrendingRecipes = async (req, res, next) => {
    try {
        const { type = "mostReviewed" } = req.query;

        const allowedTypes = [
            "mostReviewed",
            "highestRated",
        ];

        if (!allowedTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid trending type. Use mostReviewed or highestRated",
            });
        }

        // Start of current week: Sunday 00:00
        const now = new Date();

        const startOfWeek = new Date(now);
        startOfWeek.setHours(0, 0, 0, 0);

        const day = startOfWeek.getDay();

        startOfWeek.setDate(
            startOfWeek.getDate() - day
        );

        const sortStage =
            type === "mostReviewed"
                ? { reviewCount: -1 }
                : { averageRating: -1 };

        const trending = await Review.aggregate([
            // 1. Only reviews created this week
            {
                $match: {
                    createdAt: {
                        $gte: startOfWeek,
                    },
                },
            },

            // 2. Group reviews by recipe
            {
                $group: {
                    _id: "$recipe",

                    averageRating: {
                        $avg: "$rating",
                    },

                    reviewCount: {
                        $sum: 1,
                    },
                },
            },

            // 3. Sort according to requested type
            {
                $sort: sortStage,
            },

            // 4. Limit trending results
            {
                $limit: 10,
            },
        ]);

        const recipeIds = trending.map(
            (item) => item._id
        );

        if (recipeIds.length === 0) {
            return res.status(200).json({
                success: true,
                type,
                count: 0,
                recipes: [],
            });
        }

        const recipes = await Recipe.find({
            _id: {
                $in: recipeIds,
            },
        }).populate("owner", "name");

        // Create lookup map
        const recipeMap = new Map(
            recipes.map((recipe) => [
                recipe._id.toString(),
                recipe,
            ])
        );

        // Preserve aggregation order
        const result = trending
            .map((item) => {
                const recipe =
                    recipeMap.get(
                        item._id.toString()
                    );

                if (!recipe) {
                    return null;
                }

                return {
                    recipe,
                    averageRating:
                        Number(
                            item.averageRating.toFixed(1)
                        ),
                    reviewCount:
                        item.reviewCount,
                };
            })
            .filter(Boolean);

        return res.status(200).json({
            success: true,
            type,
            count: result.length,
            recipes: result,
        });

    } catch (error) {
        next(error);
    }
};