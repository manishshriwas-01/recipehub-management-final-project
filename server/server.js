import dotenv from "dotenv";
import express from "express";
import connectDB from "./config/db.js";
import authRoutes from './routes/authRoutes.js'
import recipeRoutes from './routes/recipeRoutes.js'
import errorMiddleware from "./middleware/errorMiddleware.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cors from "cors";



dotenv.config();

const app = express();

app.use(helmet());

app.use(cors({
  origin:"http://localhost:4200",
})
);
const limiter=rateLimit({
  windowMs:15*60*1000,
  max:100,
  message:{
    success:false,
    message:"Too many requests, please try again later",
  },
});
app.use(limiter);

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RecipeHub API is running",
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);

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
