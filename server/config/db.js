import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const mongoUri =
            process.env.NODE_ENV === "test"
                ? process.env.MONGODB_TEST_URI
                : process.env.MONGODB_URI;

        await mongoose.connect(mongoUri);

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

export default connectDB;