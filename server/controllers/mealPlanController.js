import MealPlan from "../models/MealPlan.js";
import mongoose from "mongoose";

export const getMealPlans = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    const mealPlans = await MealPlan.find({
      user: req.user.userId,
      date: {
        $gte: start,
        $lte: end,
      },
    })
      .populate("recipe")
      .sort({ date: 1 });

    return res.status(200).json({
      success: true,
      mealPlans,
    });
  } catch (error) {
    next(error);
  }
};

export const createMealPlan = async (req, res, next) => {
  try {
    const { recipe, date, mealType } = req.body;

    if (!recipe || !date || !mealType) {
      return res.status(400).json({
        success: false,
        message: "Recipe, date and meal type are required",
      });
    }

    const mealPlan = await MealPlan.create({
      user: req.user.userId,
      recipe,
      date,
      mealType,
    });

    await mealPlan.populate("recipe");

    return res.status(201).json({
      success: true,
      message: "Recipe added to meal plan",
      mealPlan,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A recipe is already planned for this meal",
      });
    }

    next(error);
  }
};

export const updateMealPlan = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { recipe, date, mealType } = req.body;

    const mealPlan = await MealPlan.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found",
      });
    }

    if (recipe) {
      mealPlan.recipe = recipe;
    }

    if (date) {
      mealPlan.date = date;
    }

    if (mealType) {
      mealPlan.mealType = mealType;
    }

    await mealPlan.save();
    await mealPlan.populate("recipe");

    return res.status(200).json({
      success: true,
      message: "Meal plan updated successfully",
      mealPlan,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A recipe is already planned for this meal",
      });
    }

    next(error);
  }
};

export const deleteMealPlan = async (req, res, next) => {
  try {
    const { id } = req.params;

    const mealPlan = await MealPlan.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: "Meal plan not found",
      });
    }

    await MealPlan.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Recipe removed from meal plan",
    });
  } catch (error) {
    next(error);
  }
};

export const getShoppingList = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate and endDate are required",
      });
    }

    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    const shoppingList = await MealPlan.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(req.user.userId),
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },

      {
        $lookup: {
          from: "recipes",
          localField: "recipe",
          foreignField: "_id",
          as: "recipe",
        },
      },

      {
        $unwind: "$recipe",
      },

      {
        $unwind: "$recipe.ingredients",
      },

      {
        $group: {
          _id: {
            $toLower: {
              $trim: {
                input: "$recipe.ingredients",
              },
            },
          },

          quantity: {
            $sum: 1,
          },
        },
      },

      {
        $project: {
          _id: 0,
          ingredient: "$_id",
          quantity: 1,
        },
      },

      {
        $sort: {
          ingredient: 1,
        },
      },
    ]);

    return res.status(200).json({
      success: true,
      shoppingList,
    });
  } catch (error) {
    next(error);
  }
};