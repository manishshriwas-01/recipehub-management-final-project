import Availability from "../models/Availability.js";
import Recipe from "../models/Recipe.js";

export const createAvailability = async (req, res, next) => {
    try {
        const {
            dayOfWeek,
            startTime,
            endTime,
        } = req.body;

        if (startTime >= endTime) {
            return res.status(400).json({
                success: false,
                message: "End time must be after start time",
            });
        }

        const existingAvailability = await Availability.findOne({
            instructor: req.user.userId,
            dayOfWeek,
            isActive: true,
            startTime: { $lt: endTime },
            endTime: { $gt: startTime },
        });

        if (existingAvailability) {
            return res.status(409).json({
                success: false,
                message: "This time slot overlaps with an existing availability",
            });
        }

        const availability = await Availability.create({
            instructor: req.user.userId,
            dayOfWeek,
            startTime,
            endTime,
        });

        return res.status(201).json({
            success: true,
            message: "Availability created successfully",
            availability,
        });
    } catch (error) {
        next(error);
    }
};


export const getRecipeAvailability = async (req, res, next) => {
    try {
        const { recipeId } = req.params;

        const recipe = await Recipe.findById(recipeId);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found",
            });
        }

        const instructorId = recipe.owner;

        const availability = await Availability.find({
            instructor: instructorId,
            isActive: true,
        }).sort({
            dayOfWeek: 1,
            startTime: 1,
        });

        return res.status(200).json({
            success: true,
            availability,
        });
    } catch (error) {
        next(error);
    }
};

export const getMyAvailability = async (req, res, next) => {
    try {
        const availability = await Availability.find({
            instructor: req.user.userId
        }).sort({
            dayOfWeek: 1,
            startTime: 1
        });

        return res.status(200).json({
            success: true,
            availability
        });
    } catch (error) {
        next(error);
    }
};

export const updateAvailability=async(req,res,next)=>{
    try{
        const {id}=req.params;
        const {isActive}=req.body;
        const availability=await Availability.findById(id);
        if(!availability){
            return res.status(400).json({
                success:false,
                message:"Availability not found"
            });
        }
        if(availability.instructor.toString()!==req.user.userId){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this availability"
            });
        }
        if(typeof isActive !== "boolean"){
            return res.status(400).json({
                success:false,
                message:"isActive must be a boolean"
            });
        }
        availability.isActive=isActive;
        await availability.save();

         return res.status(200).json({
            success: true,
            message: "Availability updated successfully",
            availability
        });

    }catch(error){
        next(error);
    }
}
export const deleteAvailability=async(req,res,next)=>{
    try{
        const {id}=req.params;
        const availability=await Availability.findById(id);
        if(!availability){
            return res.status(400).json({
                success:false,
                message: "Availability not found"
            });

        }
        if(availability.instructor.toString()!=req.user.userId){
             return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this availability"
            });
        }
        await Availability.findByIdAndDelete(id);
        return res.status(200).json({
            success: true,
            message: "Availability deleted successfully"
        });


    }catch(error){
        next(error);
    }
}