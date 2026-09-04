import request from "supertest";
import { app } from "../server.js";

test("Should return API health status", async () => {
  const response = await request(app)
    .get("/api/health");

  expect(response.statusCode).toBe(200);
});