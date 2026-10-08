import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

const connectDB = async () => {
    try {
        if (mongoose.connection.readyState === 1) {
            return;
        }

        let mongoUri;

        if (process.env.NODE_ENV === "test") {
            if (!mongoServer) {
                mongoServer = await MongoMemoryServer.create();
            }

            mongoUri = mongoServer.getUri();
        } else {
            mongoUri = process.env.MONGODB_URI;
        }

        await mongoose.connect(mongoUri);

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

export const closeDB = async () => {
    try {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();

        if (mongoServer) {
            await mongoServer.stop();
            mongoServer = null;
        }
    } catch (error) {
        console.error("MongoDB cleanup failed:", error.message);
    }
};



export default connectDB;