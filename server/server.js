import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import aiRoutes from "./routes/aiRoutes.js";
import helmet from "helmet";
import cors from "cors";

dotenv.config();

const app = express();

// Resolve the current server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it does not exist
const uploadsPath = path.join(__dirname, "uploads");

fs.mkdirSync(uploadsPath, { recursive: true });

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

const allowedOrigins = [
  "http://localhost:4200",
  "https://recipehub-management-final-project-0kc9.onrender.com",
];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve uploaded recipe images
app.use("/uploads", express.static(uploadsPath));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RecipeHub API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/ai", aiRoutes);

// Handle unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global error handler
app.use(errorMiddleware);

export { app };

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}