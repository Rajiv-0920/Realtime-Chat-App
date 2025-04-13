import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
    const { fullName, email, password } = req.body;
    try {
        if (!fullName || !password || !email) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const user = await User.findOne({ email });

        if (user) return res.status(400).json({ message: "Email already exist" });

        const saltRounds = 10;
        bcrypt.hash(password, saltRounds, async (err, hash) => {
            if (err) return res.status(500).json({ message: "Error on generating password hash" });
            else {
                const newUser = new User({
                    fullName: fullName,
                    email: email,
                    password: hash,
                })

                if (newUser) {
                    generateToken(newUser._id, res);
                    await newUser.save();
                    res.status(201).json({
                        _id: newUser._id,
                        fullName: newUser.fullName,
                        email: newUser.email,
                        profilePic: newUser.profilePic
                    })
                } else {
                    res.status(400).json({ message: "Invalid user data" });
                }
            }
        });
    } catch (error) {
        console.log(`Error in signup controller ${error.message}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        bcrypt.compare(password, user.password, function (err, result) {
            // result == true
            if (result) {
                generateToken(user._id, res);
                res.status(200).json({
                    _id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    profilePic: user.profilePic
                })
            } else {
                res.status(400).json({ message: "Invalid Credentials" });
            }
        });
    } catch (error) {
        console.log(`Error in login controller: ${error}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
}
export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.log(`Error in logout controller: ${error}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const updateProfile = async (req, res) => {
    console.log("Form DAta: ", new FormData())
    try {
        const { profilePic } = req.body;
        const userId = req.user._id;

        if (!profilePic) {
            return res.status(400).json({ message: "Profile pic is required" });
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { profilePic: uploadResponse.secure_url },
            { new: true }
        );

        res.status(200).json(updatedUser);
    } catch (error) {
        console.log("error in update profile:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log(`Error in checkAuth controller: ${error}`);
        res.status(500).json({ message: "Internal Server Error" });
    }
}