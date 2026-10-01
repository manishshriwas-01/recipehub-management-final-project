import Review from "../models/Review.js";
import Recipe from "../models/Recipe.js";
import Notification from "../models/Notification.js";
import { getSocketIO } from "../utils/socket.js";

export const createReview = async (req, res, next) => {
    try {
        const { recipeId, rating, comment, sentiment } = req.body;

        const recipe = await Recipe.findById(recipeId);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found",
            });
        }

        const existingReview = await Review.findOne({
            user: req.user.userId,
            recipe: recipeId,
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this recipe",
            });
        }

        const review = await Review.create({
            user: req.user.userId,
            recipe: recipeId,
            rating,
            comment,
            sentiment,
        });

        const notification = await Notification.create({
            recipient: recipe.owner,
            sender: req.user.userId,
            type: "REVIEW",
            message: "Someone reviewed your recipe",
            recipe: recipeId,
        });

        await notification.populate([
            {
                path: "sender",
                select: "name",
            },
            {
                path: "recipe",
                select: "title",
            },
        ]);

        const io = getSocketIO();

        const recipientRoom = `user:${recipe.owner.toString()}`;

        // console.log("=================================");
        // console.log("SENDING REVIEW NOTIFICATION");
        // console.log("Recipe owner:", recipe.owner.toString());
        // console.log("Reviewer:", req.user.userId);
        // console.log("Notification ID:", notification._id.toString());
        // console.log("Recipient room:", recipientRoom);

        if (!io) {
            // console.log("ERROR: Socket.IO instance is NOT available");
        } else {
            // console.log("Socket.IO instance available");

            const socketsInRoom =
                await io.in(recipientRoom).fetchSockets();

            // console.log(
            //     "Sockets in recipient room:",
            //     socketsInRoom.length
            // );

            io.to(recipientRoom).emit(
                "newNotification",
                notification
            );

            // console.log("Notification emitted");
        }

        // console.log("=================================");

        return res.status(201).json({
            success: true,
            message: "Review added successfully",
            review,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "You have already reviewed this recipe",
            });
        }

        next(error);
    }
};

export const getReviewsByRecipe = async (req, res, next) => {
    try {
        const { recipeId } = req.params;
        const { sort = "newest" } = req.query;

        const recipe = await Recipe.findById(recipeId);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found",
            });
        }

        const sortOptions = {
            newest: { createdAt: -1 },
            oldest: { createdAt: 1 },
            highest: { rating: -1 },
            lowest: { rating: 1 },
        };

        const sortStage = sortOptions[sort] || sortOptions.newest;

        const reviews = await Review.aggregate([
            {
                $match: {
                    recipe: recipe._id,
                },
            },
            {
                $sort: sortStage,
            },
            {
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $project: {
                    rating: 1,
                    comment: 1,
                    sentiment: 1,
                    helpfulBy: 1,
                    createdAt: 1,
                    "user._id": 1,
                    "user.name": 1,
                },
            },
        ]);

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
            reviews,
            averageRating: Number(averageRating.toFixed(1)),
            reviewCount,
        });
    } catch (error) {
        next(error);
    }
};

export const deleteReview = async (req, res, next) => {
    try {
        const { id } = req.params;

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        const recipe = await Recipe.findById(review.recipe);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found",
            });
        }

        const isReviewOwner =
            review.user.toString() === req.user.userId;

        const isRecipeOwner =
            recipe.owner.toString() === req.user.userId;

        const isAdmin =
            req.user.role === "admin";

        if (!isReviewOwner && !isRecipeOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this review",
            });
        }

        await Review.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: "Review deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

export const toggleHelpfulReview = async (req, res, next) => {
    try {
        const { id } = req.params;

        const review = await Review.findById(id);

        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found",
            });
        }

        const userId = req.user.userId;

        const alreadyHelpful = review.helpfulBy.some(
            (user) => user.toString() === userId
        );

        if (alreadyHelpful) {
            review.helpfulBy = review.helpfulBy.filter(
                (user) => user.toString() !== userId
            );
        } else {
            review.helpfulBy.push(userId);
        }

        await review.save();

        return res.status(200).json({
            success: true,
            message: alreadyHelpful
                ? "Removed from helpful reviews"
                : "Marked as helpful",
            helpful: !alreadyHelpful,
            helpfulCount: review.helpfulBy.length,
        });
    } catch (error) {
        next(error);
    }
};