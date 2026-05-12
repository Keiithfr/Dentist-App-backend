const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const Booking = require("./models/Booking")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("./models/User");


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err))



const app = express()

app.use(cors(({
    origin: ["http://localhost:5173",
        "http://localhost:5174",
        "https://dentist-app-theta.vercel.app"]
})));
app.use(express.json())

app.post("/signup", async (req, res) => {
    try {
        const { email, password } = req.body;
        const exists = await User.findOne({ email });
        if (exists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            email,
            password: hashedPassword,
        });

        await user.save();
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        res.status(201).json({ token })
    } catch (err) {
        res.status(500).json({ message: "Server error" })
    }
});

app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" })
        }

        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        res.json({ token });
    } catch (err) {
        res.status(500).json({ message: "Server error" })
    }
});

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "No token" })
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid token" })
    }
}



app.get("/bookings", authMiddleware, async (req, res) => {

    const bookings = await Booking.find({ userId: req.user.id, });
    res.json(bookings);

});

app.post("/bookings", authMiddleware, async (req, res) => {
    const { date, time, dentistId } = req.body;
    const appointmentTime = new Date(`${date}T${time}`);
    const exists = await Booking.findOne({
        dentistId,
        appointmentTime,


    });
    if (exists) {
        return res.status(400).json({ message: "Time already booked!" })
    }

    const newBooking = new Booking({
        name: req.body.name,
        dentistId,
        appointmentTime,
        userId: req.user.id,
    });

    await newBooking.save();

    res.status(201).json(newBooking);

});
app.listen(5000, () => {
    console.log("server running on port 5000")
})



