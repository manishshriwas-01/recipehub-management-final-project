import request from "supertest"
import connectDB from "../config/db.js";
import mongoose from "mongoose";

import { app } from '../server.js';


beforeAll(async () => {
    await connectDB();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe("Recipe Api", () => {

    test("should reject recipe creation without authentication", async () => {
        const response = await request(app)
            .post('/api/recipes')
            .send({
                title: "Paneer Butter Masala",
                imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
                ingredients: ["Paneer", "Butter", "Tomato"],
                steps: ["Cook tomatoes", "Add paneer"],
                category: "Indian",
            });
        expect(response.statusCode).toBe(401);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe("Authentication required");
    });

    test("should reject recipe creation with invalid data", async () => {
        const email = `recipe${Date.now()}@example.com`;
        const password = "12345678";

        // Register user
        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Recipe User",
                email,
                password,
            });

        // Login user
        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email,
                password,
            });

        const token = loginResponse.body.token;

        // Create recipe with invalid data
        const response = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "A",
                imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
                ingredients: [],
                steps: [],
                category: "Invalid Category",
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.errors).toBeDefined();

    });
    test("should  recipe creation with valid data", async () => {
        const email = `recipe${Date.now()}@example.com`;
        const password = "12345678";

        // Register user
        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Recipe create User",
                email,
                password,
            });

        // Login user
        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email,
                password,
            });

        const token = loginResponse.body.token;

        // Create recipe with valid data
        const response = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Paneer Butter Masala5",
                imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
                ingredients: [
                    "Paneer",
                    "Butter",
                    "Tomato",
                ],
                steps: [
                    "Cook tomatoes",
                    "Add butter",
                    "Add paneer",
                ],
                category: "Indian",
            });


        expect(response.statusCode).toBe(201);

        expect(response.body.success).toBe(true);

        expect(response.body.recipe).toHaveProperty(
            "title",
            "Paneer Butter Masala5"
        );

        expect(response.body.recipe).toHaveProperty(
            "category",
            "Indian"
        );

    });

    test("should get all recipes", async () => {
        const email = `get${Date.now()}@example.com`;
        const password = "12345678";

        // Register user
        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Get Recipe User",
                email,
                password,
            });

        // Login user
        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email,
                password,
            });

        const token = loginResponse.body.token;

        // Create a recipe
        await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Chicken Biryani",
                imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
                ingredients: [
                    "Chicken",
                    "Rice",
                    "Spices",
                ],
                steps: [
                    "Cook chicken",
                    "Add rice",
                    "Cook until ready",
                ],
                category: "Indian",
            });

        // Get all recipes
        const response = await request(app)
            .get("/api/recipes");

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.recipes).toBeDefined();

        expect(Array.isArray(response.body.recipes)).toBe(true);

        expect(response.body.recipes.length).toBeGreaterThan(0);
    });

    test("should search recipes by title", async () => {
        const response = await request(app)
            .get("/api/recipes?search=paneer");

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.recipes).toBeDefined();
    });

    test("should filter recipes by category", async () => {
        const response = await request(app)
            .get("/api/recipes?category=Indian");

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.recipes).toBeDefined();
    });

    test("should paginate recipes", async () => {
        const response = await request(app)
            .get("/api/recipes?page=1&limit=2");

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.page).toBe(1);
        expect(response.body.recipes.length).toBeLessThanOrEqual(2);
    });

    test("should search and filter recipes with pagination", async () => {
        const response = await request(app)
            .get(
                "/api/recipes?search=paneer&category=Indian&page=1&limit=2"
            );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.page).toBe(1);
        expect(response.body.recipes.length).toBeLessThanOrEqual(2);
    });

    test("should prevent another user from updating a recipe", async () => {
        // Create first user
        const ownerEmail = `owner${Date.now()}@example.com`;
        const password = "12345678";

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Recipe Owner",
                email: ownerEmail,
                password,
            });

        const ownerLogin = await request(app)
            .post("/api/auth/login")
            .send({
                email: ownerEmail,
                password,
            });

        const ownerToken = ownerLogin.body.token;

        // Owner creates recipe
        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                title: "Paneer Butter Masala",
                imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
                ingredients: ["Paneer", "Butter", "Tomato"],
                steps: ["Cook tomato", "Add paneer"],
                category: "Indian",
            });

        const recipeId = recipeResponse.body.recipe._id;

        // Create second user
        const otherEmail = `other${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Other User",
                email: otherEmail,
                password,
            });

        const otherLogin = await request(app)
            .post("/api/auth/login")
            .send({
                email: otherEmail,
                password,
            });

        const otherToken = otherLogin.body.token;

        // Other user tries to update owner's recipe
        const response = await request(app)
            .put(`/api/recipes/${recipeId}`)
            .set("Authorization", `Bearer ${otherToken}`)
            .send({
                title: "Hacked Recipe",
            });

        expect(response.statusCode).toBe(403);
        expect(response.body.success).toBe(false);
    });

    test("should allow the recipe owner to update their recipe", async () => {
        const email = `updateowner${Date.now()}@example.com`;
        const password = "12345678";

        // Register user
        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Recipe Owner",
                email,
                password,
            });

        // Login user
        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email,
                password,
            });

        const token = loginResponse.body.token;

        // Create recipe
        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Original Recipe",
                imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
                ingredients: ["Paneer", "Tomato"],
                steps: ["Cook tomato", "Add paneer"],
                category: "Indian",
            });

        const recipeId = recipeResponse.body.recipe._id;

        // Owner updates recipe
        const response = await request(app)
            .put(`/api/recipes/${recipeId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Updated Recipe",
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.recipe.title).toBe("Updated Recipe");
    });

    test("should prevent another user from deleting a recipe", async () => {
        const password = "12345678";

        // Create recipe owner
        const ownerEmail = `deleteowner${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Recipe Owner",
                email: ownerEmail,
                password,
            });

        const ownerLogin = await request(app)
            .post("/api/auth/login")
            .send({
                email: ownerEmail,
                password,
            });

        const ownerToken = ownerLogin.body.token;

        // Owner creates recipe
        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                title: "Delete Test Recipe",
                imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
                ingredients: ["Paneer", "Butter"],
                steps: ["Cook ingredients", "Serve"],
                category: "Indian",
            });

        const recipeId = recipeResponse.body.recipe._id;

        // Create another user
        const otherEmail = `deleteother${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Other User",
                email: otherEmail,
                password,
            });

        const otherLogin = await request(app)
            .post("/api/auth/login")
            .send({
                email: otherEmail,
                password,
            });

        const otherToken = otherLogin.body.token;

        // Other user tries to delete owner's recipe
        const response = await request(app)
            .delete(`/api/recipes/${recipeId}`)
            .set("Authorization", `Bearer ${otherToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.success).toBe(false);
    });

    test("should allow the recipe owner to delete their recipe", async () => {
        const email = `deleteown${Date.now()}@example.com`;
        const password = "12345678";

        // Register user
        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Delete Owner",
                email,
                password,
            });

        // Login user
        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email,
                password,
            });

        const token = loginResponse.body.token;

        // Create recipe
        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "My Delete Recipe",
                imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
                ingredients: ["Paneer", "Tomato"],
                steps: ["Cook tomato", "Add paneer"],
                category: "Indian",
            });

        const recipeId = recipeResponse.body.recipe._id;

        // Owner deletes their own recipe
        const response = await request(app)
            .delete(`/api/recipes/${recipeId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Recipe deleted successfully");

        // Verify recipe no longer exists
        const getResponse = await request(app)
            .get(`/api/recipes/${recipeId}`);

        expect(getResponse.statusCode).toBe(404);
    });

    test("should allow admin to delete another user's recipe", async () => {
        const password = "12345678";

        // Create recipe owner
        const ownerEmail = `owneradmin${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Recipe Owner",
                email: ownerEmail,
                password,
            });

        const ownerLogin = await request(app)
            .post("/api/auth/login")
            .send({
                email: ownerEmail,
                password,
            });

        const ownerToken = ownerLogin.body.token;

        // Owner creates recipe
        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                title: "Admin Delete Test",
                imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
                ingredients: ["Paneer", "Tomato"],
                steps: ["Cook tomato", "Add paneer"],
                category: "Indian",
            });

        const recipeId = recipeResponse.body.recipe._id;

        // Create admin user
        const adminEmail = `admin${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Admin User",
                email: adminEmail,
                password,
            });

        // Change role from user to admin
        const User = (await import("../models/User.js")).default;

        await User.findOneAndUpdate(
            { email: adminEmail },
            { role: "admin" }
        );

        // Login as admin
        const adminLogin = await request(app)
            .post("/api/auth/login")
            .send({
                email: adminEmail,
                password,
            });

        const adminToken = adminLogin.body.token;

        // Admin deletes owner's recipe
        const response = await request(app)
            .delete(`/api/recipes/${recipeId}`)
            .set("Authorization", `Bearer ${adminToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Recipe deleted successfully");

        // Verify recipe is deleted
        const getResponse = await request(app)
            .get(`/api/recipes/${recipeId}`);

        expect(getResponse.statusCode).toBe(404);
    });

    test("should allow admin to update another user's recipe", async () => {
        const password = "12345678";

        // Create recipe owner
        const ownerEmail = `ownerupdate${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Recipe Owner",
                email: ownerEmail,
                password,
            });

        const ownerLogin = await request(app)
            .post("/api/auth/login")
            .send({
                email: ownerEmail,
                password,
            });

        const ownerToken = ownerLogin.body.token;

        // Owner creates recipe
        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${ownerToken}`)
            .send({
                title: "Original Recipe",
                imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950",
                ingredients: ["Paneer", "Tomato"],
                steps: ["Cook tomato", "Add paneer"],
                category: "Indian",
            });

        const recipeId = recipeResponse.body.recipe._id;

        // Create admin user
        const adminEmail = `adminupdate${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Admin User",
                email: adminEmail,
                password,
            });

        // Change role to admin
        const User = (await import("../models/User.js")).default;

        await User.findOneAndUpdate(
            { email: adminEmail },
            { role: "admin" }
        );

        // Login as admin
        const adminLogin = await request(app)
            .post("/api/auth/login")
            .send({
                email: adminEmail,
                password,
            });

        const adminToken = adminLogin.body.token;

        // Admin updates owner's recipe
        const response = await request(app)
            .put(`/api/recipes/${recipeId}`)
            .set("Authorization", `Bearer ${adminToken}`)
            .send({
                title: "Updated By Admin",
                category: "Healthy",
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Recipe updated successfully");
        expect(response.body.recipe.title).toBe("Updated By Admin");
        expect(response.body.recipe.category).toBe("Healthy");
    });

});