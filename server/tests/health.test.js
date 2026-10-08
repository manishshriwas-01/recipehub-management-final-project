import request from "supertest";
import { app } from "../server.js";

describe("Health API", () => {
  it("should return API health status", async () => {
    const response = await request(app)
      .get("/api/health");

    expect(response.statusCode).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "RecipeHub API is running",
    });
  });
});