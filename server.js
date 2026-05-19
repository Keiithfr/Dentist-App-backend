const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
const Booking = require("./models/Booking")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("./models/User");
const cookieParser = require("cookie-parser")


mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err))



const app = express()

app.use(cors(({
    origin: ["http://localhost:5173",
        "http://localhost:5174",
        "https://dentist-app-theta.vercel.app"],
    credentials: true
})));

app.use(cookieParser());
app.use(express.json());

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
        res.cookie("token", token, {
            httpOnly: true, //frontend js cannot read token. Protects against token theft.
            secure: true, //only send cookies over https.
            sameSite: "None", //allows frontend and backend to be on different domains.
            maxAge: 24 * 60 * 60 * 1000 //cookie expiration set to 24hrs
        });
        res.json({
            user: {
                id: user._id,
                email: user.email
            }
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: err.message
        })
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
        res.cookie("token", token, {
            httpOnly: true, //frontend js cannot read token. Protects against token theft.
            secure: true, //only send cookies over https.
            sameSite: "None", //allows frontend and backend to be on different domains.
            maxAge: 24 * 60 * 60 * 1000 //cookie expiration set to 24hrs
        });
        res.json({
            user: {
                id: user._id,
                email: user.email
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" })
    }
});

app.post("/logout", (req, res) => {

    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    });

    res.json({
        message: "Logged out"
    });
});

const authMiddleware = (req, res, next) => {

    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            message: "No token"
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({
            message: "Invalid token"
        });
    }

};



app.get("/bookings", authMiddleware, async (req, res) => {

    const bookings = await Booking.find({ userId: req.user.id, });
    res.json(bookings);

});

app.post("/bookings", authMiddleware, async (req, res) => {

    try {

        const { date, time, dentistId } = req.body;

        const appointmentTime =
            new Date(`${date}T${time}`);

        console.log(appointmentTime);

        const exists = await Booking.findOne({
            dentistId,
            appointmentTime,
        });

        if (exists) {
            return res.status(400).json({
                message: "Time already booked!"
            });
        }

        const newBooking = new Booking({
            name: req.body.name,
            dentistId,
            appointmentTime,
            userId: req.user.id,
        });

        await newBooking.save();

        res.status(201).json(newBooking);

    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: err.message
        });
    }
});

app.delete("/bookings/:id", authMiddleware, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found"
            });
        }

        //ownership check

        if (booking.userId !== req.user.id) {
            return res.status(403).json({
                message: "Unauthorized"
            });

        }

        await Booking.findByIdAndDelete(req.params.id);

        res.json({
            message: "Booking deleted"
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({
            message: err.message
        });
    }
})

app.get("/me", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password");
        res.json(user);
    } catch (err) {
        res.status(500).json({
            message: "Server error"
        });
    }
});
app.listen(5000, () => {
    console.log("server running on port 5000")
})



