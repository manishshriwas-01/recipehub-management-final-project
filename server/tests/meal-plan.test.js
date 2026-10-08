import request from "supertest";
import mongoose from "mongoose";

import connectDB from "../config/db.js";
import { app } from "../server.js";

import User from "../models/User.js";
import Recipe from "../models/Recipe.js";
import MealPlan from "../models/MealPlan.js";

let token;
let userId;
let recipeId;
let secondRecipeId;

beforeAll(async () => {
    await connectDB();

    const email = `mealplanner${Date.now()}@example.com`;
    const password = "12345678";

    // Register test user
    const registerResponse = await request(app)
        .post("/api/auth/register")
        .send({
            name: "Meal Planner User",
            email,
            password,
        });

    expect(registerResponse.statusCode).toBe(201);

    // Login test user
    const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
            email,
            password,
        });

    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.token).toBeDefined();

    token = loginResponse.body.token;

    // Get created user
    const user = await User.findOne({ email });

    expect(user).not.toBeNull();

    userId = user._id;

    // Create recipes directly in test database
    // This avoids Cloudinary/API upload dependency.
    const recipe = await Recipe.create({
        owner: userId,
        title: "Paneer Butter Masala",
        imageUrl: "https://example.com/paneer.jpg",
        ingredients: [
            "Paneer",
            "Butter",
            "Tomato",
        ],
        steps: [
            "Cook tomato",
            "Add butter",
            "Add paneer",
        ],
        category: "Indian",
        cookTime: 30,
    });

    const secondRecipe = await Recipe.create({
        owner: userId,
        title: "Paneer Biryani",
        imageUrl: "https://example.com/biryani.jpg",
        ingredients: [
            "Paneer",
            "Rice",
            "Tomato",
        ],
        steps: [
            "Cook rice",
            "Add paneer",
            "Serve",
        ],
        category: "Indian",
        cookTime: 40,
    });

    recipeId = recipe._id.toString();
    secondRecipeId = secondRecipe._id.toString();
});

afterEach(async () => {
    await MealPlan.deleteMany({});
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe("Meal Planner API", () => {

    // =====================================================
    // 1. Authentication
    // =====================================================

    test("should reject unauthenticated meal plan creation", async () => {
        const response = await request(app)
            .post("/api/meal-plans")
            .send({
                recipe: recipeId,
                date: "2026-10-08",
                mealType: "breakfast",
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "Authentication required"
        );
    });

    // =====================================================
    // 2. Create Meal Plan
    // =====================================================

    test("should create a meal plan", async () => {
        const response = await request(app)
            .post("/api/meal-plans")
            .set("Authorization", `Bearer ${token}`)
            .send({
                recipe: recipeId,
                date: "2026-10-08",
                mealType: "breakfast",
            });

        expect(response.statusCode).toBe(201);
        expect(response.body.success).toBe(true);

        expect(response.body.message).toBe(
            "Recipe added to meal plan"
        );

        expect(response.body.mealPlan).toBeDefined();

        expect(response.body.mealPlan.recipe).toBeDefined();

        expect(response.body.mealPlan.mealType).toBe(
            "breakfast"
        );
    });

    // =====================================================
    // 3. Required Fields
    // =====================================================

    test("should reject meal plan when required fields are missing", async () => {
        const response = await request(app)
            .post("/api/meal-plans")
            .set("Authorization", `Bearer ${token}`)
            .send({
                recipe: recipeId,
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "Recipe, date and meal type are required"
        );
    });

    // =====================================================
    // 4. Duplicate Meal Slot
    // =====================================================

    test("should reject duplicate meal plan for the same date and meal type", async () => {
        const mealData = {
            recipe: recipeId,
            date: "2026-10-08",
            mealType: "lunch",
        };

        const firstResponse = await request(app)
            .post("/api/meal-plans")
            .set("Authorization", `Bearer ${token}`)
            .send(mealData);

        expect(firstResponse.statusCode).toBe(201);

        const secondResponse = await request(app)
            .post("/api/meal-plans")
            .set("Authorization", `Bearer ${token}`)
            .send(mealData);

        expect(secondResponse.statusCode).toBe(400);

        expect(secondResponse.body.success).toBe(false);

        expect(secondResponse.body.message).toBe(
            "A recipe is already planned for this meal"
        );
    });

    // =====================================================
    // 5. Get Meal Plans
    // =====================================================

    test("should get meal plans within date range", async () => {
        await request(app)
            .post("/api/meal-plans")
            .set("Authorization", `Bearer ${token}`)
            .send({
                recipe: recipeId,
                date: "2026-10-08",
                mealType: "breakfast",
            });

        await request(app)
            .post("/api/meal-plans")
            .set("Authorization", `Bearer ${token}`)
            .send({
                recipe: secondRecipeId,
                date: "2026-10-09",
                mealType: "lunch",
            });

        const response = await request(app)
            .get(
                "/api/meal-plans?startDate=2026-10-08&endDate=2026-10-09"
            )
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.mealPlans).toBeDefined();

        expect(
            Array.isArray(response.body.mealPlans)
        ).toBe(true);

        expect(response.body.mealPlans).toHaveLength(2);
    });

    // =====================================================
    // 6. Missing Date Range
    // =====================================================

    test("should reject getting meal plans without date range", async () => {
        const response = await request(app)
            .get("/api/meal-plans")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "startDate and endDate are required"
        );
    });

    // =====================================================
    // 7. Invalid Date
    // =====================================================

    test("should reject invalid meal plan date range", async () => {
        const response = await request(app)
            .get(
                "/api/meal-plans?startDate=invalid&endDate=2026-10-09"
            )
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "Invalid date format"
        );
    });

    // =====================================================
    // 8. Update Meal Plan
    // =====================================================

    test("should update a meal plan", async () => {
        const createResponse = await request(app)
            .post("/api/meal-plans")
            .set("Authorization", `Bearer ${token}`)
            .send({
                recipe: recipeId,
                date: "2026-10-08",
                mealType: "breakfast",
            });

        expect(createResponse.statusCode).toBe(201);

        const mealPlanId =
            createResponse.body.mealPlan._id;

        const response = await request(app)
            .patch(`/api/meal-plans/${mealPlanId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                recipe: secondRecipeId,
                mealType: "lunch",
            });

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.message).toBe(
            "Meal plan updated successfully"
        );

        expect(response.body.mealPlan).toBeDefined();

        expect(response.body.mealPlan.mealType).toBe(
            "lunch"
        );
    });

    // =====================================================
    // 9. Update Non-existing Meal Plan
    // =====================================================

    test("should return 404 when updating a non-existing meal plan", async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .patch(`/api/meal-plans/${fakeId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                mealType: "lunch",
            });

        expect(response.statusCode).toBe(404);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "Meal plan not found"
        );
    });

    // =====================================================
    // 10. Delete Meal Plan
    // =====================================================

    test("should delete a meal plan", async () => {
        const createResponse = await request(app)
            .post("/api/meal-plans")
            .set("Authorization", `Bearer ${token}`)
            .send({
                recipe: recipeId,
                date: "2026-10-08",
                mealType: "dinner",
            });

        expect(createResponse.statusCode).toBe(201);

        const mealPlanId =
            createResponse.body.mealPlan._id;

        const response = await request(app)
            .delete(`/api/meal-plans/${mealPlanId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.message).toBe(
            "Recipe removed from meal plan"
        );

        const deletedMealPlan =
            await MealPlan.findById(mealPlanId);

        expect(deletedMealPlan).toBeNull();
    });

    // =====================================================
    // 11. Delete Non-existing Meal Plan
    // =====================================================

    test("should return 404 when deleting a non-existing meal plan", async () => {
        const fakeId = new mongoose.Types.ObjectId();

        const response = await request(app)
            .delete(`/api/meal-plans/${fakeId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(404);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "Meal plan not found"
        );
    });

    // =====================================================
    // 12. Shopping List
    // =====================================================

    test("should generate shopping list from planned recipes", async () => {
        await request(app)
            .post("/api/meal-plans")
            .set("Authorization", `Bearer ${token}`)
            .send({
                recipe: recipeId,
                date: "2026-10-08",
                mealType: "breakfast",
            });

        await request(app)
            .post("/api/meal-plans")
            .set("Authorization", `Bearer ${token}`)
            .send({
                recipe: secondRecipeId,
                date: "2026-10-08",
                mealType: "lunch",
            });

        const response = await request(app)
            .get(
                "/api/meal-plans/shopping-list?startDate=2026-10-08&endDate=2026-10-08"
            )
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.shoppingList).toBeDefined();

        expect(
            Array.isArray(response.body.shoppingList)
        ).toBe(true);

        expect(response.body.shoppingList).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    ingredient: "paneer",
                    quantity: 2,
                }),
                expect.objectContaining({
                    ingredient: "tomato",
                    quantity: 2,
                }),
                expect.objectContaining({
                    ingredient: "butter",
                    quantity: 1,
                }),
                expect.objectContaining({
                    ingredient: "rice",
                    quantity: 1,
                }),
            ])
        );
    });

    // =====================================================
    // 13. Shopping List Missing Date Range
    // =====================================================

    test("should reject shopping list without date range", async () => {
        const response = await request(app)
            .get("/api/meal-plans/shopping-list")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "startDate and endDate are required"
        );
    });

    // =====================================================
    // 14. Shopping List Invalid Date
    // =====================================================

    test("should reject shopping list with invalid dates", async () => {
        const response = await request(app)
            .get(
                "/api/meal-plans/shopping-list?startDate=wrong&endDate=2026-10-08"
            )
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe(
            "Invalid date format"
        );
    });

    // =====================================================
    // 15. User Isolation
    // =====================================================

    test("should only return the authenticated user's meal plans", async () => {
        await request(app)
            .post("/api/meal-plans")
            .set("Authorization", `Bearer ${token}`)
            .send({
                recipe: recipeId,
                date: "2026-10-08",
                mealType: "breakfast",
            });

        const secondEmail =
            `othermealuser${Date.now()}@example.com`;

        const password = "12345678";

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Other Meal User",
                email: secondEmail,
                password,
            });

        const secondLogin = await request(app)
            .post("/api/auth/login")
            .send({
                email: secondEmail,
                password,
            });

        expect(secondLogin.statusCode).toBe(200);

        const secondToken = secondLogin.body.token;

        const response = await request(app)
            .get(
                "/api/meal-plans?startDate=2026-10-08&endDate=2026-10-08"
            )
            .set(
                "Authorization",
                `Bearer ${secondToken}`
            );

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.mealPlans).toHaveLength(0);
    });
});