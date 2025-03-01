import User from "../models/UserSchema.js";
import bcrypt from "bcrypt";

export const registerControllers = async (req, res, next) => {
    try {
        const { firstName, lastName, email, password, confirmPassword } = req.body;

        console.log("Received registration data:", req.body);

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Please enter all fields",
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match",
            });
        }

        let user = await User.findOne({ email });

        if (user) {
            return res.status(409).json({
                success: false,
                message: "User already exists",
            });
        }

        // Preparing encrypted password for storing in db
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let newUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });

        console.log("User created successfully:", newUser);

        return res.status(200).json({
            success: true,
            message: "User created successfully",
            user: newUser,
        });
    } catch (err) {
        console.error("Error during registration:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const loginControllers = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please enter all fields",
            });
        }

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Incorrect email or password",
            });
        }

        delete user.password;

        return res.status(200).json({
            success: true,
            message: `Welcome back, ${user.firstName}`,
            user,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

export const setAvatarController = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const imageData = req.body.image;

        const userData = await User.findByIdAndUpdate(
            userId,
            {
                isAvatarImageSet: true,
                avatarImage: imageData,
            },
            { new: true }
        );

        return res.status(200).json({
            isSet: userData.isAvatarImageSet,
            image: userData.avatarImage,
        });
    } catch (err) {
        next(err);
    }
};

export const allUsers = async (req, res, next) => {
    try {
        const user = await User.find({ _id: { $ne: req.params.id } }).select([
            "email",
            "firstName",
            "lastName",
            "avatarImage",
            "_id",
        ]);

        return res.json(user);
    } catch (err) {
        next(err);
    }
};