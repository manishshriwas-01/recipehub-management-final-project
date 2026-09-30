import "dotenv/config";
import mongoose from "mongoose";
import Recipe from "../models/Recipe.js";

describe("MongoDB Text Index", () => {
  // Close MongoDB connection after the test.
  afterAll(async () => {
    await mongoose.connection.close();
  });

  // Verify that the test database connection works.
  test("should use text index for recipe search", async () => {
    await mongoose.connect(process.env.MONGODB_TEST_URI);

    const result = await Recipe.find({
      $text: {
        $search: "chicken",
      },
    }).explain("executionStats");

    console.dir(result, {
      depth: null,
    });

    expect(result).toBeDefined();
  });
});