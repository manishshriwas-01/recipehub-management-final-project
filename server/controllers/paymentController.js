import razorpay from "../config/razorpay.js";
import Appointment from "../models/Appointment.js";
import crypto from "crypto";

export const createPaymentOrder = async (req, res, next) => {
  try {
    const { appointmentId } = req.body;

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (
      appointment.student.toString() !== req.user.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to pay for this appointment",
      });
    }

    if (appointment.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Payment is not available for this appointment",
      });
    }

    const amount = appointment.amount * 100;

    const options = {
      amount,
      currency: "INR",
      receipt: `appointment_${appointment._id}`,
    };

    const order = await razorpay.orders.create(options);

    appointment.razorpayOrderId = order.id;

    await appointment.save();

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {

    console.error("========== RAZORPAY ERROR ==========");
    console.error(error);
    console.error("====================================");

    // If Razorpay order creation fails,
    // don't leave the appointment as pending.
    const { appointmentId } = req.body;

    if (appointmentId) {
      await Appointment.findByIdAndUpdate(
        appointmentId,
        { status: "cancelled" }
      );
    }

    next(error);
  }
};

export const verifyPayment = async (req, res, next) => {
    try {
        const {
            appointmentId,
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = req.body;

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: "Appointment not found",
            });
        }

        // Only the student who created the appointment can verify payment
        if (appointment.student.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to verify this payment",
            });
        }

        // Make sure the order belongs to this appointment
        if (appointment.razorpayOrderId !== razorpay_order_id) {
            return res.status(400).json({
                success: false,
                message: "Invalid Razorpay order",
            });
        }

        const body = `${razorpay_order_id}|${razorpay_payment_id}`;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed",
            });
        }

        appointment.razorpayPaymentId = razorpay_payment_id;
        appointment.razorpaySignature = razorpay_signature;
        appointment.status = "confirmed";

        await appointment.save();

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            appointment,
        });
    } catch (error) {
    console.error("========== RAZORPAY ERROR ==========");
    console.error(error);
    console.error("====================================");

    next(error);
}
};