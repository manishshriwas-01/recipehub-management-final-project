import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();

// app.use(cors());

const PORT = process.env.PORT || 5000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RecipeHub API is running",
  });
});

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();