import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
    getNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get(
    "/",
    authMiddleware,
    getNotifications
);

router.get(
    "/unread-count",
    authMiddleware,
    getUnreadNotificationCount
);

router.patch(
    "/:id/read",
    authMiddleware,
    markNotificationAsRead
);

router.patch(
    "/read-all",
    authMiddleware,
    markAllNotificationsAsRead
);
export default router;