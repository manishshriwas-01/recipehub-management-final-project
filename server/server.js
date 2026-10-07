import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import reviewRoutes from './routes/reviewRoutes.js'
import collectionRoutes from './routes/collectionRoutes.js'
import mealPlanRoutes from "./routes/mealPlanRoutes.js";
import helmet from "helmet";
import cors from "cors";
import { setSocketIO } from "./utils/socket.js";
import notificationRoutes from "./routes/notificationRoutes.js";


dotenv.config();

const app = express();
const httpServer=createServer(app);

const allowedOrigins = [
  "http://localhost:4200",
  "https://recipehub-management-final-project-0kc9.onrender.com",
];


const io=new Server(httpServer,{
  cors:{
    origin:allowedOrigins,
    methods:["GET","POST"],
  },
});

setSocketIO(io);

io.use((socket,next)=>{
  try{
      const token=socket.handshake.auth.token;

      if(!token){
        return next(new Error("Authentication required"));
      }
      const decoded=jwt.verify(
        token,
        process.env.JWT_SECRET
      );
      socket.user=decoded;
      next();

  }catch(error){
    next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
    const userId = socket.user.userId;
    const room = `user:${userId}`;

    socket.join(room);

    // console.log("=================================");
    // console.log("SOCKET CONNECTED");
    // console.log("User ID:", userId);
    // console.log("Room:", room);
    // console.log("Rooms:", [...socket.rooms]);
    // console.log("=================================");

    socket.on("disconnect", (reason) => {
    // console.log(
    //     "Socket disconnected:",
    //     userId,
    //     "Reason:",
    //     reason
    // );
});
});

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);



app.use(
  cors({
    origin: allowedOrigins,
  })
);

const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RecipeHub API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use(
  "/api/meal-plans",
  mealPlanRoutes
);


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

  // app.listen(PORT, () => {
  //   console.log(`Server running on port ${PORT}`);
  // });

   httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

if (process.env.NODE_ENV !== "test") {
  startServer();
}