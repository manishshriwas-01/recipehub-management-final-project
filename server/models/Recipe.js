import mongoose from "mongoose";

const recipeSchema = new mongoose.Schema(
    {
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Recipe owner is Required"],
        },
        title: {
            type: String,
            required: [true, "Recipe title is required"],
            trim: true,
            minlength: [3, "Title must be at least 3 characters"],
            maxlength: [100, "Title cannot exceed 100 characters"],
        },
        imageUrl: {
            type: String,
            required: [true, "Recipe image is required"],
            trim: true,
        },
        ingredients: {
            type: [String],
            required: [true, "Ingredients are required"],
            validate: {
                validator: (ingredients) => ingredients.length > 0,
                message: "At least one ingredient is required",
            },
        },
        steps: {
            type: [String],
            required: [true, "Recipe steps are required"],
            validate: {
                validator: (steps) => steps.length > 0,
                message: "At least one step is required",
            },
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            enum: [
                "Indian",
                "Italian",
                "Chinese",
                "Mexican",
                "Dessert",
                "Healthy",
                "Breakfast",
                "Other",
            ],
        },
    },
    {
        timestamps: true,
    }

);

const Recipe = mongoose.model("Recipe", recipeSchema);

export default Recipe;