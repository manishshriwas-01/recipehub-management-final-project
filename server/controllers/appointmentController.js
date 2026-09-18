import Appointment from "../models/Appointment.js";
import Recipe from "../models/Recipe.js";
import Availability from "../models/Availability.js";

export const createAppointment = async (req, res, next) => {
    try {
        const { recipeId, date, startTime } = req.body;

        const recipe = await Recipe.findById(recipeId);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found",
            });
        }

        const instructorId = recipe.owner;
        const dayOfWeek = new Date(`${date}T00:00:00Z`).toLocaleDateString("en-US", {
            weekday: "long",
            timeZone: "UTC",
        });

        const [hour, minute] = startTime.split(":").map(Number);
        const totalMinutes = hour * 60 + minute + 60;
        const endTime = `${Math.floor(totalMinutes / 60).toString().padStart(2, "0")}:${(totalMinutes % 60).toString().padStart(2, "0")}`;

        if (instructorId.toString() === req.user.userId) {
            return res.status(400).json({
                success: false,
                message: "You cannot book your own recipe",
            });
        }

        const availability = await Availability.findOne({
            instructor: instructorId,
            dayOfWeek,
            startTime: { $lte: startTime },
            endTime: { $gte: endTime },
            isActive: true,
        });

        if (!availability) {
            return res.status(400).json({
                success: false,
                message: "Selected time slot is not available",
            });
        }

        const existingAppointment = await Appointment.findOne({
            instructor: instructorId,
            date: new Date(`${date}T00:00:00Z`),
            startTime,
            status: { $in: ["pending", "confirmed"] },
        });

        if (existingAppointment) {
            return res.status(409).json({
                success: false,
                message: "This appointment slot is already booked",
            });
        }

        const appointment = await Appointment.create({
            student: req.user.userId,
            instructor: instructorId,
            recipe: recipeId,
            date: new Date(`${date}T00:00:00Z`),
            startTime,
            duration: 60,
            amount: 299,
        });

        return res.status(201).json({
            success: true,
            message: "Appointment created successfully",
            appointment,
        });
    } catch (error) {
        next(error);
    }
};

export const getMyAppointments = async (req, res, next) => {
    try {
        const appointments = await Appointment.find({ student: req.user.userId })
            .populate("recipe", "title imageUrl")
            .populate("instructor", "name email")
            .sort({ date: 1, startTime: 1 });

        return res.status(200).json({ success: true, appointments });
    } catch (error) {
        next(error);
    }
};

export const getTeachingAppointments = async (req, res, next) => {
    try {
        const appointments = await Appointment.find({ instructor: req.user.userId })
            .populate("recipe", "title imageUrl")
            .populate("student", "name email")
            .sort({ date: 1, startTime: 1 });

        return res.status(200).json({ success: true, appointments });
    } catch (error) {
        next(error);
    }
};

export const getBookedSlots = async (req, res, next) => {
    try {
        const { recipeId, date } = req.query;

        const recipe = await Recipe.findById(recipeId);

        if (!recipe) {
            return res.status(404).json({
                success: false,
                message: "Recipe not found",
            });
        }

        const instructorId = recipe.owner;

        const appointments = await Appointment.find({
            instructor: instructorId,
            date: new Date(`${date}T00:00:00Z`),
            status: { $in: ["pending", "confirmed"] },
        }).select("startTime");

        const bookedSlots = appointments.map(appointment => appointment.startTime);

        return res.status(200).json({ success: true, bookedSlots });
    } catch (error) {
        next(error);
    }
};

export const cancelAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }

        if (appointment.student.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to cancel this appointment",
            });
        }

        if (appointment.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Only pending appointments can be cancelled",
            });
        }

        appointment.status = "cancelled";
        await appointment.save();

        return res.status(200).json({
            success: true,
            message: "Appointment cancelled successfully",
            appointment,
        });

    } catch (error) {
        next(error);
    }
}

export const addMeetingLink = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { meetLink } = req.body;

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }

        if (appointment.instructor.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this appointment",
            });
        }

        if (appointment.status !== "confirmed") {
            return res.status(400).json({
                success: false,
                message: "Meeting link can only be added to confirmed appointments",
            });
        }

        if (!meetLink || !/^https:\/\/meet\.google\.com\/.+/.test(meetLink)) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid Google Meet link",
            });
        }

        appointment.meetLink = meetLink.trim();
        await appointment.save();

        return res.status(200).json({
            success: true,
            message: "Meeting link added successfully",
            appointment,
        });
    } catch (error) {
        next(error);
    }
};