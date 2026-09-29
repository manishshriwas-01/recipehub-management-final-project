import request from "supertest";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import connectDB from "../config/db.js";

import { app } from "../server.js";
import User from "../models/User.js";
import Recipe from "../models/Recipe.js";
import Collection from "../models/Collection.js";

const createToken = (user) =>
  jwt.sign(
    { userId: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );

describe("Collection API", () => {
     beforeAll(async () => {
    await connectDB();
  });
  let user;
  let otherUser;
  let recipe;
  let otherRecipe;
  let token;
  let otherToken;
  let collection;

  beforeEach(async () => {
    await Collection.deleteMany({});
    await Recipe.deleteMany({});
    await User.deleteMany({});

    const password = await bcrypt.hash("Test@123", 10);

    user = await User.create({
      name: "Collection User",
      email: `collection-${Date.now()}@test.com`,
      password,
      role: "user",
    });

    otherUser = await User.create({
      name: "Other User",
      email: `other-${Date.now()}@test.com`,
      password,
      role: "user",
    });

    token = createToken(user);
    otherToken = createToken(otherUser);

    recipe = await Recipe.create({
      owner: user._id,
      title: "Test Recipe",
      ingredients: ["Tomato", "Onion"],
      steps: ["Cut vegetables", "Cook vegetables"],
      category: "Indian",
      imageUrl: "https://example.com/recipe.jpg",
    });

    otherRecipe = await Recipe.create({
      owner: otherUser._id,
      title: "Other Recipe",
      ingredients: ["Rice"],
      steps: ["Cook rice"],
      category: "Chinese",
      imageUrl: "https://example.com/other.jpg",
    });

    collection = await Collection.create({
      owner: user._id,
      name: "My Recipes",
      recipes: [],
      isPublic: false,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe("POST /api/collections", () => {
    test("should create a collection", async () => {
      const response = await request(app)
        .post("/api/collections")
        .set("Authorization", `Bearer ${token}`)
        .field("name", "Dinner Recipes");

      expect(response.statusCode).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.collection.name).toBe("Dinner Recipes");
      expect(response.body.collection.owner).toBe(user._id.toString());
    });

    test("should reject unauthenticated request", async () => {
      const response = await request(app)
        .post("/api/collections")
        .field("name", "Dinner Recipes");

      expect(response.statusCode).toBe(401);
    });

    test("should reject duplicate collection name", async () => {
      const response = await request(app)
        .post("/api/collections")
        .set("Authorization", `Bearer ${token}`)
        .field("name", "My Recipes");

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(
        "You already have a collection with this name"
      );
    });
  });

  describe("GET /api/collections", () => {
    test("should return user's collections with pagination", async () => {
      await Collection.create({
        owner: user._id,
        name: "Breakfast Recipes",
        recipes: [recipe._id],
      });

      const response = await request(app)
        .get("/api/collections?page=1&limit=10")
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.collections).toHaveLength(2);
      expect(response.body.pagination).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 10,
          total: 2,
          totalPages: 1,
        })
      );
    });

    test("should reject unauthenticated request", async () => {
      const response = await request(app).get("/api/collections");

      expect(response.statusCode).toBe(401);
    });
  });

  describe("GET /api/collections/:id", () => {
    test("should return owner's collection", async () => {
      const response = await request(app)
        .get(`/api/collections/${collection._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.collection.name).toBe("My Recipes");
    });

    test("should reject another user from viewing private collection", async () => {
      const response = await request(app)
        .get(`/api/collections/${collection._id}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.statusCode).toBe(403);
    });

    test("should return 404 for non-existing collection", async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/collections/${fakeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe("Collection not found");
    });
  });

  describe("PUT /api/collections/:id", () => {
    test("should update collection name and visibility", async () => {
      const response = await request(app)
        .put(`/api/collections/${collection._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Updated Recipes",
          isPublic: true,
        });

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.collection.name).toBe("Updated Recipes");
      expect(response.body.collection.isPublic).toBe(true);
    });

    test("should reject update by another user", async () => {
      const response = await request(app)
        .put(`/api/collections/${collection._id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({
          name: "Hacked Collection",
        });

      expect(response.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/collections/:id", () => {
    test("should delete owner's collection", async () => {
      const response = await request(app)
        .delete(`/api/collections/${collection._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedCollection = await Collection.findById(collection._id);
      expect(deletedCollection).toBeNull();
    });

    test("should reject delete by another user", async () => {
      const response = await request(app)
        .delete(`/api/collections/${collection._id}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.statusCode).toBe(404);
    });
  });

  describe("POST /api/collections/:collectionId/recipes/:recipeId", () => {
    test("should add recipe to collection", async () => {
      const response = await request(app)
        .post(`/api/collections/${collection._id}/recipes/${recipe._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe(
        "Recipe added to collection successfully"
      );

      const updatedCollection = await Collection.findById(collection._id);

      expect(
        updatedCollection.recipes.some(
          (id) => id.toString() === recipe._id.toString()
        )
      ).toBe(true);
    });

    test("should reject duplicate recipe", async () => {
      collection.recipes.push(recipe._id);
      await collection.save();

      const response = await request(app)
        .post(`/api/collections/${collection._id}/recipes/${recipe._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(400);
      expect(response.body.message).toBe(
        "Recipe is already in this collection"
      );
    });

    test("should reject non-existing recipe", async () => {
      const fakeRecipeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .post(`/api/collections/${collection._id}/recipes/${fakeRecipeId}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe("Recipe not found");
    });

    test("should reject another user from adding recipe", async () => {
      const response = await request(app)
        .post(`/api/collections/${collection._id}/recipes/${recipe._id}`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/collections/:collectionId/recipes/:recipeId", () => {
    test("should remove recipe from collection", async () => {
      collection.recipes.push(recipe._id);
      await collection.save();

      const response = await request(app)
        .delete(`/api/collections/${collection._id}/recipes/${recipe._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedCollection = await Collection.findById(collection._id);

      expect(
        updatedCollection.recipes.some(
          (id) => id.toString() === recipe._id.toString()
        )
      ).toBe(false);
    });

    test("should return 404 when recipe is not in collection", async () => {
      const response = await request(app)
        .delete(`/api/collections/${collection._id}/recipes/${recipe._id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe(
        "Recipe is not in this collection"
      );
    });
  });

  describe("POST /api/collections/:id/share", () => {
    test("should share collection and generate share token", async () => {
      const response = await request(app)
        .post(`/api/collections/${collection._id}/share`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe("Collection shared successfully");
      expect(response.body.shareUrl).toContain("/shared-collection/");

      const updatedCollection = await Collection.findById(collection._id);

      expect(updatedCollection.isPublic).toBe(true);
      expect(updatedCollection.shareToken).toBeTruthy();
    });

    test("should reject sharing by another user", async () => {
      const response = await request(app)
        .post(`/api/collections/${collection._id}/share`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.statusCode).toBe(404);
    });
  });

  describe("DELETE /api/collections/:id/share", () => {
    test("should disable collection sharing", async () => {
      collection.isPublic = true;
      collection.shareToken = "test-share-token";
      await collection.save();

      const response = await request(app)
        .delete(`/api/collections/${collection._id}/share`)
        .set("Authorization", `Bearer ${token}`);

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);

      const updatedCollection = await Collection.findById(collection._id);

      expect(updatedCollection.isPublic).toBe(false);
      expect(updatedCollection.shareToken).toBeUndefined();
    });

    test("should reject unsharing by another user", async () => {
      const response = await request(app)
        .delete(`/api/collections/${collection._id}/share`)
        .set("Authorization", `Bearer ${otherToken}`);

      expect(response.statusCode).toBe(404);
    });
  });

  describe("GET /api/collections/shared/:shareToken", () => {
    test("should return a public shared collection", async () => {
      collection.isPublic = true;
      collection.shareToken = "public-share-token";
      collection.recipes.push(recipe._id);
      await collection.save();

      const response = await request(app).get(
        "/api/collections/shared/public-share-token"
      );

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.collection.name).toBe("My Recipes");
      expect(response.body.collection.isPublic).toBe(true);
      expect(response.body.collection.recipes).toHaveLength(1);
      expect(response.body.collection.recipes[0].title).toBe("Test Recipe");
    });

    test("should return 404 for invalid share token", async () => {
      const response = await request(app).get(
        "/api/collections/shared/invalid-token"
      );

      expect(response.statusCode).toBe(404);
      expect(response.body.message).toBe("Shared collection not found");
    });

    test("should not return a private collection through share token", async () => {
      collection.shareToken = "private-token";
      collection.isPublic = false;
      await collection.save();

      const response = await request(app).get(
        "/api/collections/shared/private-token"
      );

      expect(response.statusCode).toBe(404);
    });
  });
});