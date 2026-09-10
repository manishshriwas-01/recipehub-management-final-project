import Recipe from "../models/Recipe.js";
import User from "../models/User.js";

//add recipe to favorites
export const addFavorite = async (req, res, next) => {
    try {
        const { id } = req.params;
        const recipe = await Recipe.findById(id);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found",
            });
        }

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        if (user.favorites.includes(recipe._id)) {
            return res.status(400).json({
                success: false,
                message: "Recipe is already in favorites",
            })
        }

        user.favorites.push(recipe._id);

        await user.save();

        res.status(200).json({
            success: true,
            message: "Recipe added to favorites",
        });

    } catch (error) {
        next(error);
    }
}


// Remove recipe from favorites
export const removeFavorite = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const favoriteExists = user.favorites.some(
            (favoriteId) => favoriteId.toString() === id
        );

        if (!favoriteExists) {
            return res.status(400).json({
                success: false,
                message: "Recipe is not in favorites",
            });
        }

        user.favorites = user.favorites.filter(
            (favoriteId) => favoriteId.toString() !== id
        );

        await user.save();

        res.status(200).json({
            success: true,
            message: "Recipe removed from favorites",
        });
    } catch (error) {
        next(error);
    }
};


//get favorite recipes

export const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).populate({
      path: "favorites",
      populate: {
        path: "owner",
        select: "name email",
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      count: user.favorites.length,
      recipes: user.favorites,
    });
  } catch (error) {
    console.error("Get favorites error:", error);
    next(error);
  }
};