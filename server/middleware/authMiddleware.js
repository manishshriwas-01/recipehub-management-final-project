import jwt from "jsonwebtoken";
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required",
            });
        }
        const token=authHeader.split(" ")[1];
        const decoded=jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        req.user=decoded; // decode krne par wahi aata hai jo humne jwt.sign krte time user id or jo bhi variable dale the
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
}
export default authMiddleware;