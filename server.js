const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const Booking = require("./models/Booking")


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err))



const app = express()

app.use(cors(({
    origin: ["http://localhost:5173",
        "https://dentist-app-theta.vercel.app"]
})));
app.use(express.json())



app.get("/bookings", async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) {
            return res.status(400).json({ message: "userId is required" });
        }
        const bookings = await Booking.find({ userId });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: "Server error" })
    }
});

app.post("/bookings", async (req, res) => {
    try {
        const { name, date, time, dentistId, userId } = req.body;

        if (!name || !date || !time || !dentistId || !userId) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const exists = await Booking.findOne({ date, time, dentistId: req.body.dentistId });
        if (exists) {
            return res.status(400).json({ message: "Time already booked" })
        }

        const newBooking = new Booking(req.body);
        await newBooking.save();

        res.status(201).json(newBooking);
    } catch (err) {
        res.status(500).json({ message: "Server error" })
    }

});
app.listen(5000, () => {
    console.log("server running on port 5000")
})



