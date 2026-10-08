import request from "supertest";
// import connectDB from "../config/db.js";
import connectDB, { closeDB } from "../config/db";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { app } from "../server.js";
import User from "../models/User.js";
import Recipe from "../models/Recipe.js";
import Review from "../models/Review.js";

beforeAll(async () => {
    await connectDB();
});

afterAll(async () => {
     await closeDB();
});

describe("Review API", () => {
    let user;
    let otherUser;
    let recipe;
    let review;
    let token;
    let otherToken;

    beforeEach(async () => {
        await Review.deleteMany({});
        await Recipe.deleteMany({});
        await User.deleteMany({});

        const password = await bcrypt.hash("Test@123", 10);

        // Main user
        user = await User.create({
            name: "Review User",
            email: `review-${Date.now()}@test.com`,
            password,
            role: "user",
        });

        // Second user
        otherUser = await User.create({
            name: "Other User",
            email: `other-${Date.now()}@test.com`,
            password,
            role: "user",
        });

        // JWT for main user
        token = jwt.sign(
            {
                userId: user._id.toString(),
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
            }
        );

        // JWT for second user
        otherToken = jwt.sign(
            {
                userId: otherUser._id.toString(),
                role: otherUser.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h",
            }
        );

        // Test recipe
        recipe = await Recipe.create({
            owner: user._id,
            title: "Paneer Butter Masala",
            ingredients: ["Paneer", "Butter", "Tomato"],
            steps: ["Cook tomato", "Add paneer"],
            category: "Indian",
            imageUrl: "https://example.com/test-image.jpg",
            cookTime: 30,
        });
    });

    // =========================================================
    // POST /api/reviews
    // =========================================================

    describe("POST /api/reviews", () => {
        test("should reject unauthenticated request", async () => {
            const response = await request(app)
                .post("/api/reviews")
                .send({
                    recipeId: recipe._id,
                    rating: 5,
                    comment: "Excellent recipe",
                    sentiment: "positive",
                });

            expect(response.statusCode).toBe(401);
            expect(response.body.success).toBe(false);
        });

        test("should create a review", async () => {
            const response = await request(app)
                .post("/api/reviews")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    recipeId: recipe._id,
                    rating: 5,
                    comment: "Excellent recipe",
                    sentiment: "positive",
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.review).toBeDefined();
            expect(response.body.review.rating).toBe(5);
            expect(response.body.review.comment).toBe("Excellent recipe");
        });

        test("should reject duplicate review", async () => {
            await Review.create({
                user: user._id,
                recipe: recipe._id,
                rating: 4,
                comment: "Good recipe",
                sentiment: "positive",
            });

            const response = await request(app)
                .post("/api/reviews")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    recipeId: recipe._id,
                    rating: 5,
                    comment: "Excellent recipe",
                    sentiment: "positive",
                });

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe(
                "You have already reviewed this recipe"
            );
        });

        test("should return 404 for non-existing recipe", async () => {
            const fakeRecipeId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .post("/api/reviews")
                .set("Authorization", `Bearer ${token}`)
                .send({
                    recipeId: fakeRecipeId,
                    rating: 5,
                    comment: "Excellent recipe",
                    sentiment: "positive",
                });

            expect(response.statusCode).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Recipe not found");
        });
    });

    // =========================================================
    // GET /api/reviews/:recipeId
    // =========================================================

    describe("GET /api/reviews/:recipeId", () => {
        beforeEach(async () => {
            await Review.create([
                {
                    user: user._id,
                    recipe: recipe._id,
                    rating: 5,
                    comment: "Excellent recipe",
                    sentiment: "positive",
                },
                {
                    user: otherUser._id,
                    recipe: recipe._id,
                    rating: 3,
                    comment: "Good recipe",
                    sentiment: "neutral",
                },
            ]);
        });

        test("should return reviews with rating statistics", async () => {
            const response = await request(app).get(
                `/api/reviews/${recipe._id}`
            );

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.reviews).toHaveLength(2);
            expect(response.body.reviewCount).toBe(2);
            expect(response.body.averageRating).toBe(4);
        });

        test("should sort reviews by highest rating", async () => {
            const response = await request(app)
                .get(`/api/reviews/${recipe._id}`)
                .query({ sort: "highest" });

            expect(response.statusCode).toBe(200);
            expect(response.body.reviews[0].rating).toBe(5);
            expect(response.body.reviews[1].rating).toBe(3);
        });

        test("should sort reviews by lowest rating", async () => {
            const response = await request(app)
                .get(`/api/reviews/${recipe._id}`)
                .query({ sort: "lowest" });

            expect(response.statusCode).toBe(200);
            expect(response.body.reviews[0].rating).toBe(3);
            expect(response.body.reviews[1].rating).toBe(5);
        });

        test("should return 404 for non-existing recipe", async () => {
            const fakeRecipeId = new mongoose.Types.ObjectId();

            const response = await request(app).get(
                `/api/reviews/${fakeRecipeId}`
            );

            expect(response.statusCode).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Recipe not found");
        });
    });

    // =========================================================
    // DELETE /api/reviews/:id
    // =========================================================

    describe("DELETE /api/reviews/:id", () => {
        beforeEach(async () => {
            review = await Review.create({
                user: otherUser._id,
                recipe: recipe._id,
                rating: 4,
                comment: "Good recipe",
                sentiment: "positive",
            });
        });

        test("should allow review owner to delete review", async () => {
            const response = await request(app)
                .delete(`/api/reviews/${review._id}`)
                .set("Authorization", `Bearer ${otherToken}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);

            const deletedReview = await Review.findById(review._id);

            expect(deletedReview).toBeNull();
        });

        test("should allow recipe owner to delete review", async () => {
            const response = await request(app)
                .delete(`/api/reviews/${review._id}`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
        });

        test("should reject unauthorized user", async () => {
            const thirdUser = await User.create({
                name: "Third User",
                email: `third-${Date.now()}@test.com`,
                password: await bcrypt.hash("Test@123", 10),
                role: "user",
            });

            const thirdToken = jwt.sign(
                {
                    userId: thirdUser._id.toString(),
                    role: thirdUser.role,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: "1h",
                }
            );

            const response = await request(app)
                .delete(`/api/reviews/${review._id}`)
                .set("Authorization", `Bearer ${thirdToken}`);

            expect(response.statusCode).toBe(403);
            expect(response.body.success).toBe(false);
        });

        test("should return 404 for non-existing review", async () => {
            const fakeReviewId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .delete(`/api/reviews/${fakeReviewId}`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Review not found");
        });
    });

    // =========================================================
    // POST /api/reviews/:id/helpful
    // =========================================================

    describe("POST /api/reviews/:id/helpful", () => {
        beforeEach(async () => {
            review = await Review.create({
                user: otherUser._id,
                recipe: recipe._id,
                rating: 4,
                comment: "Good recipe",
                sentiment: "positive",
            });
        });

        test("should mark review as helpful", async () => {
            const response = await request(app)
                .post(`/api/reviews/${review._id}/helpful`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.helpful).toBe(true);
            expect(response.body.helpfulCount).toBe(1);
        });

        test("should remove helpful vote when toggled again", async () => {
            await request(app)
                .post(`/api/reviews/${review._id}/helpful`)
                .set("Authorization", `Bearer ${token}`);

            const response = await request(app)
                .post(`/api/reviews/${review._id}/helpful`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.helpful).toBe(false);
            expect(response.body.helpfulCount).toBe(0);
        });

        test("should return 404 for non-existing review", async () => {
            const fakeReviewId = new mongoose.Types.ObjectId();

            const response = await request(app)
                .post(`/api/reviews/${fakeReviewId}/helpful`)
                .set("Authorization", `Bearer ${token}`);

            expect(response.statusCode).toBe(404);
            expect(response.body.success).toBe(false);
        });
    });
});