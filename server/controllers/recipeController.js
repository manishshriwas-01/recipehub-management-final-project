import Recipe from '../models/Recipe.js';

export const createRecipe = async (req, res, next) => {
    try {
        const { title, imageUrl, ingredients, steps, category, } = req.body;

        const recipe = await Recipe.create({
            owner: req.user.userId,
            title,
            imageUrl,
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
        
        const{search,category,page=1,limit=10}=req.query;
        const filter={};
        //search by recipe
        if(search){
            filter.title={
                $regex:search,
                $options:"i",
            };
        }
        //filter by category

        if(category){
            filter.category=category;
        }

        //pagination

        const pageNumber=Number(page);
        const  limitNumber=Number(limit);
        const skip=(pageNumber-1)*limitNumber;
        
        const recipes=await Recipe.find(filter)
        .populate("owner", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber);

        const totalRecipes=await Recipe.countDocuments(filter);

        return res.status(200).json({
            success: true,
            count: recipes.length,
            total:totalRecipes,
            page:pageNumber,
            pages:Math.ceil(totalRecipes/limitNumber),
            recipes,
        });
    } catch (error) {
        next(error);
    }
};

export const getRecipe = async (req, res, next) => {
    try {
        const { id } = req.params;
        const recipe = await Recipe.findById(id).populate("owner", "name email");

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
        const { id } = await req.params;
        const {
            title,
            imageUrl,
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

        const isOwner = recipe.owner.toString() === req.user.userId;
        const isAdmin = req.user.role === "admin";
        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this recipe",
            });
        }
        recipe.title = title ?? recipe.title;
        recipe.imageUrl = imageUrl ?? recipe.imageUrl;
        recipe.ingredients = ingredients ?? recipe.ingredients;
        recipe.steps = steps ?? recipe.steps;
        recipe.category = category ?? recipe.category;

        await recipe.save();

        return res.status(200).json({
            success: true,
            message: "Recipe updated successfully",
            recipe,
        });
    } catch (error) {
        next(error);
    }
}

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

        const isOwner = recipe.owner.toString() === req.user.userId;
        const isAdmin = req.user.role === "admin";
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
}