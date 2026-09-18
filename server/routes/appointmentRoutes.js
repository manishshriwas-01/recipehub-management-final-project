import express from "express";

import {
    createAppointment,
    getMyAppointments,
    getTeachingAppointments,
    getBookedSlots,
    cancelAppointment,
    addMeetingLink
} from "../controllers/appointmentController.js";
import { appointmentValidator } from "../validators/appointmentValidator.js";
import validate from '../middleware/validate.js'

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
    "/",
    authMiddleware,
      appointmentValidator,
     validate,
    createAppointment
);

router.get(
    "/my",
    authMiddleware,
    getMyAppointments
);

router.get(
    "/teaching",
    authMiddleware,
    getTeachingAppointments
);

router.get(
    "/booked-slots",
    getBookedSlots
);
router.patch("/:id/cancel", authMiddleware, cancelAppointment);
router.patch("/:id/meeting-link", authMiddleware, addMeetingLink);


export default router;