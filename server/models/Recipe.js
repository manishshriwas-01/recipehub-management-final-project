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
        cookTime: {
            type: Number,
            required: [true, "Cook time is required"],
            min: [1, "Cook time must be at least 1 minute"],
        },
        servings: {
            type: Number,
            required: [true, "Servings are required"],
            min: [1, "Servings must be at least 1"],
            default: 2,
        },
    },
    {
        timestamps: true,
    }



);
recipeSchema.index({
    title: "text",
    ingredients: "text",
});

const Recipe = mongoose.model("Recipe", recipeSchema);

export default Recipe;