import request from "supertest";
import connectDB from "../config/db.js";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";

import { app } from "../server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testImage = path.join(
    __dirname,
    "fixtures",
    "test.png"
);

beforeAll(async () => {
    await connectDB();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe("Recipe API", () => {

    test("should reject recipe creation without authentication", async () => {
        const response = await request(app)
            .post("/api/recipes")
            .send({
                title: "Paneer Butter Masala",
                ingredients: [
                    "Paneer",
                    "Butter",
                    "Tomato",
                ],
                steps: [
                    "Cook tomatoes",
                    "Add paneer",
                ],
                category: "Indian",
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "Authentication required"
        );
    });


    test("should reject recipe creation with invalid data", async () => {
        const email = `recipeinvalid${Date.now()}@example.com`;
        const password = "12345678";

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Recipe User",
                email,
                password,
            });

        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email,
                password,
            });

        const token = loginResponse.body.token;

        const response = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${token}`)
            .field("title", "A")
            .field("ingredients", JSON.stringify([]))
            .field("steps", JSON.stringify([]))
            .field("category", "Invalid Category")
            .attach("image", testImage);

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.errors).toBeDefined();
    });


    test("should create a recipe with valid data", async () => {
        const email = `recipecreate${Date.now()}@example.com`;
        const password = "12345678";

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Recipe Create User",
                email,
                password,
            });

        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email,
                password,
            });

        const token = loginResponse.body.token;

        const response = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${token}`)
            .field("title", "Paneer Butter Masala5")
            .field(
                "ingredients",
                JSON.stringify([
                    "Paneer",
                    "Butter",
                    "Tomato",
                ])
            )
            .field(
                "steps",
                JSON.stringify([
                    "Cook tomatoes",
                    "Add butter",
                    "Add paneer",
                ])
            )
            .field("category", "Indian")
            .attach("image", testImage);

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

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Get Recipe User",
                email,
                password,
            });

        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email,
                password,
            });

        const token = loginResponse.body.token;

        await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${token}`)
            .field("title", "Chicken Biryani")
            .field(
                "ingredients",
                JSON.stringify([
                    "Chicken",
                    "Rice",
                    "Spices",
                ])
            )
            .field(
                "steps",
                JSON.stringify([
                    "Cook chicken",
                    "Add rice",
                    "Cook until ready",
                ])
            )
            .field("category", "Indian")
            .attach("image", testImage);

        const response = await request(app)
            .get("/api/recipes");

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.recipes).toBeDefined();

        expect(
            Array.isArray(response.body.recipes)
        ).toBe(true);

        expect(
            response.body.recipes.length
        ).toBeGreaterThan(0);
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

        expect(
            response.body.recipes.length
        ).toBeLessThanOrEqual(2);
    });


    test("should search and filter recipes with pagination", async () => {
        const response = await request(app)
            .get(
                "/api/recipes?search=paneer&category=Indian&page=1&limit=2"
            );

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.page).toBe(1);

        expect(
            response.body.recipes.length
        ).toBeLessThanOrEqual(2);
    });


    test("should prevent another user from updating a recipe", async () => {
        const ownerEmail = `owner${Date.now()}@example.com`;
        const otherEmail = `other${Date.now()}@example.com`;
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

        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${ownerToken}`)
            .field("title", "Paneer Butter Masala")
            .field(
                "ingredients",
                JSON.stringify([
                    "Paneer",
                    "Butter",
                    "Tomato",
                ])
            )
            .field(
                "steps",
                JSON.stringify([
                    "Cook tomato",
                    "Add paneer",
                ])
            )
            .field("category", "Indian")
            .attach("image", testImage);

        const recipeId = recipeResponse.body.recipe._id;

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

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Recipe Owner",
                email,
                password,
            });

        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email,
                password,
            });

        const token = loginResponse.body.token;

        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${token}`)
            .field("title", "Original Recipe")
            .field(
                "ingredients",
                JSON.stringify([
                    "Paneer",
                    "Tomato",
                ])
            )
            .field(
                "steps",
                JSON.stringify([
                    "Cook tomato",
                    "Add paneer",
                ])
            )
            .field("category", "Indian")
            .attach("image", testImage);

        const recipeId = recipeResponse.body.recipe._id;

        const response = await request(app)
            .put(`/api/recipes/${recipeId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                title: "Updated Recipe",
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.recipe.title).toBe(
            "Updated Recipe"
        );
    });


    test("should prevent another user from deleting a recipe", async () => {
        const password = "12345678";

        const ownerEmail =
            `deleteowner${Date.now()}@example.com`;

        const otherEmail =
            `deleteother${Date.now()}@example.com`;

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

        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${ownerToken}`)
            .field("title", "Delete Test Recipe")
            .field(
                "ingredients",
                JSON.stringify([
                    "Paneer",
                    "Butter",
                ])
            )
            .field(
                "steps",
                JSON.stringify([
                    "Cook ingredients",
                    "Serve",
                ])
            )
            .field("category", "Indian")
            .attach("image", testImage);

        const recipeId = recipeResponse.body.recipe._id;

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

        const response = await request(app)
            .delete(`/api/recipes/${recipeId}`)
            .set("Authorization", `Bearer ${otherToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.success).toBe(false);
    });


    test("should allow the recipe owner to delete their recipe", async () => {
        const email = `deleteown${Date.now()}@example.com`;
        const password = "12345678";

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Delete Owner",
                email,
                password,
            });

        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email,
                password,
            });

        const token = loginResponse.body.token;

        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${token}`)
            .field("title", "My Delete Recipe")
            .field(
                "ingredients",
                JSON.stringify([
                    "Paneer",
                    "Tomato",
                ])
            )
            .field(
                "steps",
                JSON.stringify([
                    "Cook tomato",
                    "Add paneer",
                ])
            )
            .field("category", "Indian")
            .attach("image", testImage);

        const recipeId = recipeResponse.body.recipe._id;

        const response = await request(app)
            .delete(`/api/recipes/${recipeId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
            "Recipe deleted successfully"
        );

        const getResponse = await request(app)
            .get(`/api/recipes/${recipeId}`);

        expect(getResponse.statusCode).toBe(404);
    });

});