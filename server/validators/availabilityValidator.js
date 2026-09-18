import { body } from "express-validator";

export const availabilityValidator = [
    body("dayOfWeek")
        .trim()
        .notEmpty()
        .withMessage("Day is required")
        .isIn([
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
        ])
        .withMessage("Invalid day"),

    body("startTime")
        .trim()
        .notEmpty()
        .withMessage("Start time is required")
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage("Start time must be in HH:MM format"),

    body("endTime")
        .trim()
        .notEmpty()
        .withMessage("End time is required")
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage("End time must be in HH:MM format"),
];