import dotenv from "dotenv";
import Razorpay from "razorpay";

dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
console.log("Razorpay initialized:", {
    keyId: process.env.RAZORPAY_KEY_ID,
    secretExists: !!process.env.RAZORPAY_KEY_SECRET
});

export default razorpay; 