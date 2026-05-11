const mongoose = require("mongoose")



const bookingSchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    dentistId: { type: String, required: true },
    userId: { type: String, required: true },
});

bookingSchema.index(
    { dentistId: 1, date: 1, time: 1 },
    { unique: true }
);

module.exports = mongoose.model("Booking", bookingSchema);