import request from "supertest";
import { app } from "../server.js";
import connectDB from "../config/db.js";

beforeAll(async () => {
    await connectDB();
});

describe("Authentication Api", () => {
    test("should register a new user", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "Test User",
                email: `test${Date.now()}@example.com`,
                password: "12345678",
            });

        expect(response.statusCode).toBe(201);

        expect(response.body.success).toBe(true);


        expect(response.body.user).toHaveProperty("email");
    });

    test("should reject registration with invalid data", async () => {
        const response = await request(app)
            .post("/api/auth/register")
            .send({
                name: "A",
                email: "invalid-email",
                password: "123",
            });

        expect(response.statusCode).toBe(400);

        expect(response.body.success).toBe(false);

        expect(response.body.errors).toBeDefined();
    });


    test("Should login an existing user", async () => {
        const email = `login${Date.now()}@example.com`;
        const password = "12345678";

        await request(app)
            .post('/api/auth/register')
            .send({
                name: "Login User",
                email,
                password,
            });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email,
                password,
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user).toHaveProperty("email", email);
    });


    test("should reject login with wrong password", async () => {
        const email = `wrongpassword${Date.now()}@example.com`;
        const password = "12345678";

        await request(app)
            .post('/api/auth/register')
            .send({
                name: "Wrong password User",
                email,
                password,
            });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email,
                password: "wrongpassword",
            });

        expect(response.statusCode).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Invalid email or password");
    });


    test("should return current authenticated user", async () => {
        const email = `me${Date.now()}@example.com`;
        const password = "12345678";

        // Register user
        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Me User",
                email,
                password,
            });

        // Login to get JWT token
        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email,
                password,
            });

        const token = loginResponse.body.token;

        // Get current user
        const response = await request(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.user).toHaveProperty("email", email);

        expect(response.body.user).toHaveProperty("name", "Me User");
    });

    test("should reject access to /me without authentication", async () => {
        const response = await request(app)
            .get("/api/auth/me");

        expect(response.statusCode).toBe(401);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe("Authentication required");
    });


    test("should delete the authenticated user's account", async () => {
        const email = `delete${Date.now()}@example.com`;
        const password = "12345678";

        // Register user
        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Delete User",
                email,
                password,
            });

        // Login and get token
        const loginResponse = await request(app)
            .post("/api/auth/login")
            .send({
                email,
                password,
            });

        const token = loginResponse.body.token;

        // Delete own account
        const response = await request(app)
            .delete("/api/auth/me")
            .set("Authorization", `Bearer ${token}`);

        expect(response.statusCode).toBe(200);

        expect(response.body.success).toBe(true);

        expect(response.body.message).toBe("Account deleted successfully");

        // Verify account no longer exists
        const meResponse = await request(app)
            .get("/api/auth/me")
            .set("Authorization", `Bearer ${token}`);

        expect(meResponse.statusCode).toBe(404);
    });

});