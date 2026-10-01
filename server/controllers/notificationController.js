import Notification from "../models/Notification.js";

export const getNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user.userId,
        })
            .populate("sender", "name")
            .populate("recipe", "title")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            notifications,
        });
    } catch (error) {
        next(error);
    }
};

export const getUnreadNotificationCount = async (req, res, next) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.user.userId,
            read: false,
        });

        return res.status(200).json({
            success: true,
            count,
        });
    } catch (error) {
        next(error);
    }
};

export const markNotificationAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;

        const notification = await Notification.findOne({
            _id: id,
            recipient: req.user.userId,
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: "Notification not found",
            });
        }

        notification.read = true;

        await notification.save();

        return res.status(200).json({
            success: true,
            message: "Notification marked as read",
            notification,
        });
    } catch (error) {
        next(error);
    }
};

export const markAllNotificationsAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            {
                recipient: req.user.userId,
                read: false,
            },
            {
                $set: {
                    read: true,
                },
            }
        );

        return res.status(200).json({
            success: true,
            message: "All notifications marked as read",
        });
    } catch (error) {
        next(error);
    }
};