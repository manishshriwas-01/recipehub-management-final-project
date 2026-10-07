import mongoose from "mongoose";

const mealPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    recipe: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Recipe",
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

mealPlanSchema.index(
  {
    user: 1,
    date: 1,
    mealType: 1,
  },
  {
    unique: true,
  }
);

const MealPlan = mongoose.model(
  "MealPlan",
  mealPlanSchema
);

export default MealPlan;