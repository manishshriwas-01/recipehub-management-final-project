import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import authRoutes from './routes/authRoutes.js'
import recipeRoutes from './routes/recipeRoutes.js'
import errorMiddleware from "./middleware/errorMiddleware.js";
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

app.use('/api/auth',authRoutes);
app.use('/api/recipes',recipeRoutes);
app.use(errorMiddleware);

const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();