import request from "supertest";
import { jest } from "@jest/globals";

const createMock = jest.fn();

jest.unstable_mockModule("@google/genai", () => ({
    GoogleGenAI: jest.fn().mockImplementation(() => ({
        interactions: {
            create: createMock,
        },
    })),
}));

const { app } = await import("../server.js");

describe("AI Chat API", () => {

    beforeEach(() => {
        createMock.mockReset();
    });

    test("should return AI response for a valid message", async () => {
        createMock.mockResolvedValue({
            output_text: "Try a simple vegetarian pasta.",
        });

        const response = await request(app)
            .post("/api/ai/chat")
            .send({
                message: "Suggest a quick vegetarian dinner",
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
            "Try a simple vegetarian pasta."
        );

        expect(createMock).toHaveBeenCalledWith({
            model: "gemini-3.6-flash",
            input: "Suggest a quick vegetarian dinner",
        });
    });


    test("should reject an empty message", async () => {
        const response = await request(app)
            .post("/api/ai/chat")
            .send({
                message: "",
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });


    test("should reject a message longer than 1000 characters", async () => {
        const response = await request(app)
            .post("/api/ai/chat")
            .send({
                message: "a".repeat(1001),
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });


    test("should reject request without message", async () => {
        const response = await request(app)
            .post("/api/ai/chat")
            .send({});

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
    });

});