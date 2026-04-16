const mongoose = require("mongoose")



const bookingSchema = new mongoose.Schema({
    name: String,
    date: String,
    time: String,
    dentistId: String
});

module.exports = mongoose.model("Booking", bookingSchema);