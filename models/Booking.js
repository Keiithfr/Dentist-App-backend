const mongoose = require("mongoose")



const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    appointmentTime: {
        type: Date,
        required: true,
    },
    dentistId: { type: String, required: true },
    userId: { type: String, required: true },
});

bookingSchema.index(
    { dentistId: 1, appointmentTime: 1 },
    { unique: true }
);

module.exports = mongoose.model("Booking", bookingSchema);