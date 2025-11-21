import User from "./auth.model.js";
import bcrypt from "bcrypt";
import { generateAccessToken, generateRefreshToken } from "../../utils/token.js";

export const AuthService = {
    register: async (data) => {
        const exists = await User.findOne({ email: data.email });
        if (exists) throw new Error("Email already registered");

        const hashed = await bcrypt.hash(data.password, 10);

        const user = await User.create({
            name: data.name,
            email: data.email,
            password: hashed,
        });

        return user;
    },

    login: async (data) => {
        const user = await User.findOne({ email: data.email });
        if (!user) throw new Error("Invalid email or password");

        const match = await bcrypt.compare(data.password, user.password);
        if (!match) throw new Error("Invalid email or password");

        // Tokens
        const accessToken = generateAccessToken({ id: user._id });
        const refreshToken = generateRefreshToken({ id: user._id });

        return { user, accessToken, refreshToken };
    }
};
