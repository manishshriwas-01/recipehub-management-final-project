import Recipe from '../models/Recipe.js';
import User from '../models/User.js';
import cloudinary from "../config/cloudinary.js";

export const createRecipe = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Recipe image is required",
            });
        }

        const { title, ingredients, steps, category } = req.body;

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

        // Filter by user id
        if (ownerId) {
            filter.owner = ownerId;
        }

        const skip = (pageNumber - 1) * safeLimit;

        const recipes = await Recipe.find(filter)
            .populate("owner", "name")
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
            .populate("owner", "name");

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