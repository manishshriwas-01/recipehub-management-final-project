import request from "supertest";
import { app } from "../server";
import mongoose from "mongoose";
import connectDB from "../config/db";
import path from "path";
import { fileURLToPath } from "url";

// import Appointment from "../models/Appointment.js";

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
})

describe("Appointment Api", () => {
    test('should reject appintment creation without authentication', async () => {
        const response = await request(app)
            .post('/api/appointments')
            .send({
                recipeId: "507f1f77bcf86cd799439011",
                date: "2026-09-25",
                startTime: "10:00",
            });
        expect(response.statusCode).toBe(401);

        expect(response.body.success).toBe(false);

        expect(response.body.message).toBe("Authentication required");
    });

    test("should create an appointment for an authenticated student", async () => {
        const password = "12345678";
        const instructorEmail = `instructor${Date.now()}@example.com`;
        const studentEmail = `student${Date.now()}@example.com`;
        // 
        // console.log("1. Register instructor");

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Instructor User",
                email: instructorEmail,
                password,
            });

        // console.log("2. Instructor registered");

        const instructorLogin = await request(app)
            .post("/api/auth/login")
            .send({
                email: instructorEmail,
                password,
            });

        // console.log("3. Instructor logged in");

        const instructorToken = instructorLogin.body.token;

        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${instructorToken}`)
            .field("title", "Test Recipe")
            .field("ingredients", JSON.stringify(["Paneer", "Tomato"]))
            .field("steps", JSON.stringify(["Cook tomato", "Add paneer"]))
            .field("category", "Indian")
            .attach("image", testImage);

        // console.log("4. Recipe created");
        // 
        const recipeId = recipeResponse.body.recipe._id;

        await request(app)
            .post("/api/auth/register")
            .send({
                name: "Student User",
                email: studentEmail,
                password,
            });

        // console.log("5. Student registered");

        const studentLogin = await request(app)
            .post("/api/auth/login")
            .send({
                email: studentEmail,
                password,
            });

        // console.log("6. Student logged in");

        const studentToken = studentLogin.body.token;

        await request(app)
            .post("/api/availability")
            .set("Authorization", `Bearer ${instructorToken}`)
            .send({
                dayOfWeek: "Friday",
                startTime: "10:00",
                endTime: "12:00",
            });

        // console.log("7. Availability created");

        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                recipeId,
                date: "2026-09-25",
                startTime: "10:00",
            });

        // console.log("8. Appointment created");
    }, 15000);

    test("should reject booking own recipe", async () => {
        const password = "12345678";
        const email = `owner${Date.now()}@example.com`;

        await request(app)
            .post('/api/auth/register')
            .send({
                name: "Recipe Owner",
                email,
                password
            });
        const login = await request(app)
            .post("/api/auth/login")
            .send({
                email,
                password
            });

        // console.log("Login response:", login.statusCode, login.body);

        expect(login.statusCode).toBe(200);
        expect(login.body.success).toBe(true);
        expect(login.body.token).toBeDefined();

        const token = login.body.token;
        const recipeResponse = await request(app)
            .post('/api/recipes')
            .set("Authorization", `Bearer ${token}`)
            .field("title", "My Own Recipe")
            .field("ingredients", JSON.stringify(["Paneer"]))
            .field("steps", JSON.stringify(["Cook paneer"]))
            .field("category", "Indian")
            .attach("image", testImage);
        // console.log("Recipe response:", recipeResponse.statusCode, recipeResponse.body);

        expect(recipeResponse.statusCode).toBe(201);
        expect(recipeResponse.body.success).toBe(true);


        const recipeId = recipeResponse.body.recipe._id;
        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${token}`)
            .send({
                recipeId,
                date: "2026-09-25",
                startTime: "10:00"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("You cannot book your own recipe");
    }, 15000);


    test("should reject appointment outside instructor availability", async () => {
        const password = "12345678";
        const instructorEmail = `instructor${Date.now()}@example.com`;
        const studentEmail = `student${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Instructor User", email: instructorEmail, password });

        const instructorLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: instructorEmail, password });

        const instructorToken = instructorLogin.body.token;

        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${instructorToken}`)
            .field("title", "Available Recipe")
            .field("ingredients", JSON.stringify(["Paneer"]))
            .field("steps", JSON.stringify(["Cook paneer"]))
            .field("category", "Indian")
            .attach("image", testImage);

        expect(recipeResponse.statusCode).toBe(201);

        const recipeId = recipeResponse.body.recipe._id;

        await request(app)
            .post("/api/availability")
            .set("Authorization", `Bearer ${instructorToken}`)
            .send({
                dayOfWeek: "Friday",
                startTime: "10:00",
                endTime: "12:00"
            });

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Student User", email: studentEmail, password });

        const studentLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: studentEmail, password });

        const studentToken = studentLogin.body.token;

        const response = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                recipeId,
                date: "2026-09-25",
                startTime: "13:00"
            });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Selected time slot is not available");
    }, 15000);
    test("should reject double booking of the same slot", async () => {
        const password = "12345678";
        const instructorEmail = `instructor${Date.now()}@example.com`;
        const studentOneEmail = `studentone${Date.now()}@example.com`;
        const studentTwoEmail = `studenttwo${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Instructor User", email: instructorEmail, password });

        const instructorLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: instructorEmail, password });

        const instructorToken = instructorLogin.body.token;

        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${instructorToken}`)
            .field("title", "Double Booking Recipe")
            .field("ingredients", JSON.stringify(["Paneer"]))
            .field("steps", JSON.stringify(["Cook paneer"]))
            .field("category", "Indian")
            .attach("image", testImage);

        expect(recipeResponse.statusCode).toBe(201);

        const recipeId = recipeResponse.body.recipe._id;

        const availabilityResponse = await request(app)
            .post("/api/availability")
            .set("Authorization", `Bearer ${instructorToken}`)
            .send({
                dayOfWeek: "Friday",
                startTime: "10:00",
                endTime: "12:00"
            });

        expect(availabilityResponse.statusCode).toBe(201);

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Student One", email: studentOneEmail, password });

        const studentOneLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: studentOneEmail, password });

        const studentOneToken = studentOneLogin.body.token;

        const firstBooking = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${studentOneToken}`)
            .send({
                recipeId,
                date: "2026-09-25",
                startTime: "10:00"
            });

        expect(firstBooking.statusCode).toBe(201);

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Student Two", email: studentTwoEmail, password });

        const studentTwoLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: studentTwoEmail, password });

        const studentTwoToken = studentTwoLogin.body.token;

        const secondBooking = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${studentTwoToken}`)
            .send({
                recipeId,
                date: "2026-09-25",
                startTime: "10:00"
            });

        expect(secondBooking.statusCode).toBe(409);
        expect(secondBooking.body.success).toBe(false);
        expect(secondBooking.body.message).toBe("This appointment slot is already booked");
    }, 15000);
    test("should return booked slots for a recipe", async () => {
        const password = "12345678";
        const instructorEmail = `instructor${Date.now()}@example.com`;
        const studentEmail = `student${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Instructor User", email: instructorEmail, password });

        const instructorLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: instructorEmail, password });

        const instructorToken = instructorLogin.body.token;

        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${instructorToken}`)
            .field("title", "Booked Slots Recipe")
            .field("ingredients", JSON.stringify(["Paneer"]))
            .field("steps", JSON.stringify(["Cook paneer"]))
            .field("category", "Indian")
            .attach("image", testImage);

        expect(recipeResponse.statusCode).toBe(201);

        const recipeId = recipeResponse.body.recipe._id;

        await request(app)
            .post("/api/availability")
            .set("Authorization", `Bearer ${instructorToken}`)
            .send({
                dayOfWeek: "Friday",
                startTime: "10:00",
                endTime: "12:00"
            });

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Student User", email: studentEmail, password });

        const studentLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: studentEmail, password });

        const studentToken = studentLogin.body.token;

        const bookingResponse = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                recipeId,
                date: "2026-09-25",
                startTime: "10:00"
            });

        expect(bookingResponse.statusCode).toBe(201);

        const response = await request(app)
            .get("/api/appointments/booked-slots")
            .query({
                recipeId,
                date: "2026-09-25"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.bookedSlots).toContain("10:00");
    }, 15000);

    test("should return appointments for authenticated student", async () => {
        const password = "12345678";
        const instructorEmail = `instructor${Date.now()}@example.com`;
        const studentEmail = `student${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Instructor User", email: instructorEmail, password });

        const instructorLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: instructorEmail, password });

        expect(instructorLogin.statusCode).toBe(200);
        expect(instructorLogin.body.success).toBe(true);
        expect(instructorLogin.body.token).toBeDefined();

        const instructorToken = instructorLogin.body.token;

        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${instructorToken}`)
            .field("title", "My Booking Recipe")
            .field("ingredients", JSON.stringify(["Paneer"]))
            .field("steps", JSON.stringify(["Cook paneer"]))
            .field("category", "Indian")
            .attach("image", testImage);

        expect(recipeResponse.statusCode).toBe(201);

        const recipeId = recipeResponse.body.recipe._id;

        await request(app)
            .post("/api/availability")
            .set("Authorization", `Bearer ${instructorToken}`)
            .send({
                dayOfWeek: "Friday",
                startTime: "10:00",
                endTime: "12:00"
            });

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Student User", email: studentEmail, password });

        const studentLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: studentEmail, password });

        const studentToken = studentLogin.body.token;

        const bookingResponse = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                recipeId,
                date: "2026-09-25",
                startTime: "10:00"
            });

        expect(bookingResponse.statusCode).toBe(201);

        const response = await request(app)
            .get("/api/appointments/my")
            .set("Authorization", `Bearer ${studentToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.appointments).toHaveLength(1);
        expect(response.body.appointments[0].recipe._id).toBe(recipeId);
        expect(response.body.appointments[0].student).toBeDefined();
    }, 15000);

    test("should reject fetching appointments without authentication", async () => {
        const response = await request(app)
            .get("/api/appointments/my");

        expect(response.statusCode).toBe(401);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe("Authentication required");
    });
    test("should return teaching appointments for authenticated instructor", async () => {
        const password = "12345678";
        const instructorEmail = `instructor${Date.now()}@example.com`;
        const studentEmail = `student${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Instructor User", email: instructorEmail, password });

        const instructorLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: instructorEmail, password });

        expect(instructorLogin.statusCode).toBe(200);
        expect(instructorLogin.body.token).toBeDefined();

        const instructorToken = instructorLogin.body.token;

        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${instructorToken}`)
            .field("title", "Teaching Recipe")
            .field("ingredients", JSON.stringify(["Paneer"]))
            .field("steps", JSON.stringify(["Cook paneer"]))
            .field("category", "Indian")
            .attach("image", testImage);

        expect(recipeResponse.statusCode).toBe(201);

        const recipeId = recipeResponse.body.recipe._id;

        const availabilityResponse = await request(app)
            .post("/api/availability")
            .set("Authorization", `Bearer ${instructorToken}`)
            .send({
                dayOfWeek: "Friday",
                startTime: "10:00",
                endTime: "12:00"
            });

        expect(availabilityResponse.statusCode).toBe(201);

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Student User", email: studentEmail, password });

        const studentLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: studentEmail, password });

        expect(studentLogin.statusCode).toBe(200);
        expect(studentLogin.body.token).toBeDefined();

        const studentToken = studentLogin.body.token;

        const bookingResponse = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                recipeId,
                date: "2026-09-25",
                startTime: "10:00"
            });

        expect(bookingResponse.statusCode).toBe(201);

        const response = await request(app)
            .get("/api/appointments/teaching")
            .set("Authorization", `Bearer ${instructorToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.appointments).toHaveLength(1);
        expect(response.body.appointments[0].recipe._id).toBe(recipeId);
        expect(response.body.appointments[0].student).toBeDefined();
    }, 15000);

    test("should cancel a pending appointment", async () => {
        const password = "12345678";
        const instructorEmail = `instructor${Date.now()}@example.com`;
        const studentEmail = `student${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Instructor User", email: instructorEmail, password });

        const instructorLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: instructorEmail, password });

        expect(instructorLogin.statusCode).toBe(200);

        const instructorToken = instructorLogin.body.token;

        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${instructorToken}`)
            .field("title", "Cancellation Recipe")
            .field("ingredients", JSON.stringify(["Paneer"]))
            .field("steps", JSON.stringify(["Cook paneer"]))
            .field("category", "Indian")
            .attach("image", testImage);

        expect(recipeResponse.statusCode).toBe(201);

        const recipeId = recipeResponse.body.recipe._id;

        const availabilityResponse = await request(app)
            .post("/api/availability")
            .set("Authorization", `Bearer ${instructorToken}`)
            .send({
                dayOfWeek: "Friday",
                startTime: "10:00",
                endTime: "12:00"
            });

        expect(availabilityResponse.statusCode).toBe(201);

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Student User", email: studentEmail, password });

        const studentLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: studentEmail, password });

        expect(studentLogin.statusCode).toBe(200);

        const studentToken = studentLogin.body.token;

        const bookingResponse = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                recipeId,
                date: "2026-09-25",
                startTime: "10:00"
            });

        expect(bookingResponse.statusCode).toBe(201);

        const appointmentId = bookingResponse.body.appointment._id;

        const response = await request(app)
            .patch(`/api/appointments/${appointmentId}/cancel`)
            .set("Authorization", `Bearer ${studentToken}`);

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.appointment.status).toBe("cancelled");
    }, 15000);

    test("should reject cancellation by another student", async () => {
        const password = "12345678";
        const instructorEmail = `instructor${Date.now()}@example.com`;
        const studentOneEmail = `studentone${Date.now()}@example.com`;
        const studentTwoEmail = `studenttwo${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Instructor User", email: instructorEmail, password });

        const instructorLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: instructorEmail, password });

        expect(instructorLogin.statusCode).toBe(200);

        const instructorToken = instructorLogin.body.token;

        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${instructorToken}`)
            .field("title", "Authorization Recipe")
            .field("ingredients", JSON.stringify(["Paneer"]))
            .field("steps", JSON.stringify(["Cook paneer"]))
            .field("category", "Indian")
            .attach("image", testImage);

        expect(recipeResponse.statusCode).toBe(201);

        const recipeId = recipeResponse.body.recipe._id;

        const availabilityResponse = await request(app)
            .post("/api/availability")
            .set("Authorization", `Bearer ${instructorToken}`)
            .send({
                dayOfWeek: "Friday",
                startTime: "10:00",
                endTime: "12:00"
            });

        expect(availabilityResponse.statusCode).toBe(201);

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Student One", email: studentOneEmail, password });

        const studentOneLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: studentOneEmail, password });

        expect(studentOneLogin.statusCode).toBe(200);

        const studentOneToken = studentOneLogin.body.token;

        const bookingResponse = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${studentOneToken}`)
            .send({
                recipeId,
                date: "2026-09-25",
                startTime: "10:00"
            });

        expect(bookingResponse.statusCode).toBe(201);

        const appointmentId = bookingResponse.body.appointment._id;

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Student Two", email: studentTwoEmail, password });

        const studentTwoLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: studentTwoEmail, password });

        expect(studentTwoLogin.statusCode).toBe(200);

        const studentTwoToken = studentTwoLogin.body.token;

        const response = await request(app)
            .patch(`/api/appointments/${appointmentId}/cancel`)
            .set("Authorization", `Bearer ${studentTwoToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "You are not authorized to cancel this appointment"
        );
    }, 15000);

    test("should reject cancellation by another student", async () => {
        const password = "12345678";
        const instructorEmail = `instructor${Date.now()}@example.com`;
        const studentOneEmail = `studentone${Date.now()}@example.com`;
        const studentTwoEmail = `studenttwo${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Instructor User", email: instructorEmail, password });

        const instructorLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: instructorEmail, password });

        expect(instructorLogin.statusCode).toBe(200);

        const instructorToken = instructorLogin.body.token;

        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${instructorToken}`)
            .field("title", "Authorization Recipe")
            .field("ingredients", JSON.stringify(["Paneer"]))
            .field("steps", JSON.stringify(["Cook paneer"]))
            .field("category", "Indian")
            .attach("image", testImage);

        expect(recipeResponse.statusCode).toBe(201);

        const recipeId = recipeResponse.body.recipe._id;

        const availabilityResponse = await request(app)
            .post("/api/availability")
            .set("Authorization", `Bearer ${instructorToken}`)
            .send({
                dayOfWeek: "Friday",
                startTime: "10:00",
                endTime: "12:00"
            });

        expect(availabilityResponse.statusCode).toBe(201);

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Student One", email: studentOneEmail, password });

        const studentOneLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: studentOneEmail, password });

        expect(studentOneLogin.statusCode).toBe(200);

        const studentOneToken = studentOneLogin.body.token;

        const bookingResponse = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${studentOneToken}`)
            .send({
                recipeId,
                date: "2026-09-25",
                startTime: "10:00"
            });

        expect(bookingResponse.statusCode).toBe(201);

        const appointmentId = bookingResponse.body.appointment._id;

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Student Two", email: studentTwoEmail, password });

        const studentTwoLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: studentTwoEmail, password });

        expect(studentTwoLogin.statusCode).toBe(200);

        const studentTwoToken = studentTwoLogin.body.token;

        const response = await request(app)
            .patch(`/api/appointments/${appointmentId}/cancel`)
            .set("Authorization", `Bearer ${studentTwoToken}`);

        expect(response.statusCode).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "You are not authorized to cancel this appointment"
        );
    }, 15000);

    test("should allow instructor to add meeting link to confirmed appointment", async () => {
        const password = "12345678";
        const instructorEmail = `instructor${Date.now()}@example.com`;
        const studentEmail = `student${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Instructor User", email: instructorEmail, password });

        const instructorLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: instructorEmail, password });

        expect(instructorLogin.statusCode).toBe(200);

        const instructorToken = instructorLogin.body.token;

        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${instructorToken}`)
            .field("title", "Meeting Link Recipe")
            .field("ingredients", JSON.stringify(["Paneer"]))
            .field("steps", JSON.stringify(["Cook paneer"]))
            .field("category", "Indian")
            .attach("image", testImage);

        expect(recipeResponse.statusCode).toBe(201);

        const recipeId = recipeResponse.body.recipe._id;

        const availabilityResponse = await request(app)
            .post("/api/availability")
            .set("Authorization", `Bearer ${instructorToken}`)
            .send({
                dayOfWeek: "Friday",
                startTime: "10:00",
                endTime: "12:00"
            });

        expect(availabilityResponse.statusCode).toBe(201);

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Student User", email: studentEmail, password });

        const studentLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: studentEmail, password });

        expect(studentLogin.statusCode).toBe(200);

        const studentToken = studentLogin.body.token;

        const bookingResponse = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                recipeId,
                date: "2026-09-25",
                startTime: "10:00"
            });

        expect(bookingResponse.statusCode).toBe(201);

        const appointmentId = bookingResponse.body.appointment._id;

        await mongoose.connection.collection("appointments").updateOne(
            { _id: new mongoose.Types.ObjectId(appointmentId) },
            { $set: { status: "confirmed" } }
        );

        const response = await request(app)
            .patch(`/api/appointments/${appointmentId}/meeting-link`)
            .set("Authorization", `Bearer ${instructorToken}`)
            .send({
                meetLink: "https://meet.google.com/abc-defg-hij"
            });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe("Meeting link added successfully");
        expect(response.body.appointment.meetLink).toBe(
            "https://meet.google.com/abc-defg-hij"
        );
    });

    test("should reject meeting link update by a non-instructor", async () => {
        const password = "12345678";
        const instructorEmail = `instructor${Date.now()}@example.com`;
        const studentEmail = `student${Date.now()}@example.com`;

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Instructor User", email: instructorEmail, password });

        const instructorLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: instructorEmail, password });

        expect(instructorLogin.statusCode).toBe(200);

        const instructorToken = instructorLogin.body.token;

        const recipeResponse = await request(app)
            .post("/api/recipes")
            .set("Authorization", `Bearer ${instructorToken}`)
            .field("title", "Authorization Recipe")
            .field("ingredients", JSON.stringify(["Paneer"]))
            .field("steps", JSON.stringify(["Cook paneer"]))
            .field("category", "Indian")
            .attach("image", testImage);

        expect(recipeResponse.statusCode).toBe(201);

        const recipeId = recipeResponse.body.recipe._id;

        await request(app)
            .post("/api/availability")
            .set("Authorization", `Bearer ${instructorToken}`)
            .send({
                dayOfWeek: "Friday",
                startTime: "10:00",
                endTime: "12:00"
            });

        await request(app)
            .post("/api/auth/register")
            .send({ name: "Student User", email: studentEmail, password });

        const studentLogin = await request(app)
            .post("/api/auth/login")
            .send({ email: studentEmail, password });

        expect(studentLogin.statusCode).toBe(200);

        const studentToken = studentLogin.body.token;

        const bookingResponse = await request(app)
            .post("/api/appointments")
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                recipeId,
                date: "2026-09-25",
                startTime: "10:00"
            });

        expect(bookingResponse.statusCode).toBe(201);

        const appointmentId = bookingResponse.body.appointment._id;

        await mongoose.connection.collection("appointments").updateOne(
            { _id: new mongoose.Types.ObjectId(appointmentId) },
            { $set: { status: "confirmed" } }
        );

        const response = await request(app)
            .patch(`/api/appointments/${appointmentId}/meeting-link`)
            .set("Authorization", `Bearer ${studentToken}`)
            .send({
                meetLink: "https://meet.google.com/abc-defg-hij"
            });

        expect(response.statusCode).toBe(403);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe(
            "You are not authorized to update this appointment"
        );
    });


    test("should reject invalid Google Meet link", async () => {
    const password = "12345678";
    const instructorEmail = `instructor${Date.now()}@example.com`;
    const studentEmail = `student${Date.now()}@example.com`;

    await request(app)
        .post("/api/auth/register")
        .send({ name: "Instructor User", email: instructorEmail, password });

    const instructorLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: instructorEmail, password });

    const instructorToken = instructorLogin.body.token;

    const recipeResponse = await request(app)
        .post("/api/recipes")
        .set("Authorization", `Bearer ${instructorToken}`)
        .field("title", "Invalid Link Recipe")
        .field("ingredients", JSON.stringify(["Paneer"]))
        .field("steps", JSON.stringify(["Cook paneer"]))
        .field("category", "Indian")
        .attach("image", testImage);

    expect(recipeResponse.statusCode).toBe(201);

    const recipeId = recipeResponse.body.recipe._id;

    const availabilityResponse = await request(app)
        .post("/api/availability")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send({
            dayOfWeek: "Friday",
            startTime: "10:00",
            endTime: "12:00"
        });

    expect(availabilityResponse.statusCode).toBe(201);

    await request(app)
        .post("/api/auth/register")
        .send({ name: "Student User", email: studentEmail, password });

    const studentLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: studentEmail, password });

    const studentToken = studentLogin.body.token;

    const bookingResponse = await request(app)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
            recipeId,
            date: "2026-09-25",
            startTime: "10:00"
        });

    expect(bookingResponse.statusCode).toBe(201);

    const appointmentId = bookingResponse.body.appointment._id;

    await mongoose.connection.collection("appointments").updateOne(
        { _id: new mongoose.Types.ObjectId(appointmentId) },
        { $set: { status: "confirmed" } }
    );

    const response = await request(app)
        .patch(`/api/appointments/${appointmentId}/meeting-link`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send({
            meetLink: "https://zoom.us/test-meeting"
        });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
        "Please provide a valid Google Meet link"
    );
});

test("should reject meeting link for pending appointment", async () => {
    const password = "12345678";
    const instructorEmail = `instructor${Date.now()}@example.com`;
    const studentEmail = `student${Date.now()}@example.com`;

    await request(app)
        .post("/api/auth/register")
        .send({ name: "Instructor User", email: instructorEmail, password });

    const instructorLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: instructorEmail, password });

    const instructorToken = instructorLogin.body.token;

    const recipeResponse = await request(app)
        .post("/api/recipes")
        .set("Authorization", `Bearer ${instructorToken}`)
        .field("title", "Pending Meeting Recipe")
        .field("ingredients", JSON.stringify(["Paneer"]))
        .field("steps", JSON.stringify(["Cook paneer"]))
        .field("category", "Indian")
        .attach("image", testImage);

    expect(recipeResponse.statusCode).toBe(201);

    const recipeId = recipeResponse.body.recipe._id;

    const availabilityResponse = await request(app)
        .post("/api/availability")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send({
            dayOfWeek: "Friday",
            startTime: "10:00",
            endTime: "12:00"
        });

    expect(availabilityResponse.statusCode).toBe(201);

    await request(app)
        .post("/api/auth/register")
        .send({ name: "Student User", email: studentEmail, password });

    const studentLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: studentEmail, password });

    const studentToken = studentLogin.body.token;

    const bookingResponse = await request(app)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
            recipeId,
            date: "2026-09-25",
            startTime: "10:00"
        });

    expect(bookingResponse.statusCode).toBe(201);

    const appointmentId = bookingResponse.body.appointment._id;

    const response = await request(app)
        .patch(`/api/appointments/${appointmentId}/meeting-link`)
        .set("Authorization", `Bearer ${instructorToken}`)
        .send({
            meetLink: "https://meet.google.com/abc-defg-hij"
        });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
        "Meeting link can only be added to confirmed appointments"
    );
});


test("should reject payment order creation by another user", async () => {
    const password = "12345678";
    const instructorEmail = `instructor${Date.now()}@example.com`;
    const studentEmail = `student${Date.now()}@example.com`;
    const otherStudentEmail = `other${Date.now()}@example.com`;

    await request(app)
        .post("/api/auth/register")
        .send({ name: "Instructor User", email: instructorEmail, password });

    const instructorLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: instructorEmail, password });

    const instructorToken = instructorLogin.body.token;

    const recipeResponse = await request(app)
        .post("/api/recipes")
        .set("Authorization", `Bearer ${instructorToken}`)
        .field("title", "Payment Authorization Recipe")
        .field("ingredients", JSON.stringify(["Paneer"]))
        .field("steps", JSON.stringify(["Cook paneer"]))
        .field("category", "Indian")
        .attach("image", testImage);

    expect(recipeResponse.statusCode).toBe(201);

    const recipeId = recipeResponse.body.recipe._id;

    const availabilityResponse = await request(app)
        .post("/api/availability")
        .set("Authorization", `Bearer ${instructorToken}`)
        .send({
            dayOfWeek: "Friday",
            startTime: "10:00",
            endTime: "12:00"
        });

    expect(availabilityResponse.statusCode).toBe(201);

    await request(app)
        .post("/api/auth/register")
        .send({ name: "Student User", email: studentEmail, password });

    const studentLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: studentEmail, password });

    const studentToken = studentLogin.body.token;

    const bookingResponse = await request(app)
        .post("/api/appointments")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({
            recipeId,
            date: "2026-09-25",
            startTime: "10:00"
        });

    expect(bookingResponse.statusCode).toBe(201);

    const appointmentId = bookingResponse.body.appointment._id;

    await request(app)
        .post("/api/auth/register")
        .send({ name: "Other Student", email: otherStudentEmail, password });

    const otherStudentLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: otherStudentEmail, password });

    const otherStudentToken = otherStudentLogin.body.token;

    const response = await request(app)
        .post("/api/payments/create-order")
        .set("Authorization", `Bearer ${otherStudentToken}`)
        .send({ appointmentId });

    expect(response.statusCode).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe(
        "You are not authorized to pay for this appointment"
    );
});



});