import { AuthService } from "./auth.service.js";
import { success, error } from "../../utils/apiResponse.js";

export const AuthController = {
    register: async (req, res) => {
        try {
            const user = await AuthService.register(req.body);
            return success(res, "User registered successfully", user);
        } catch (err) {
            return error(res, err.message, 400);
        }
    },

    login: async (req, res) => {
        try {
            const { user, accessToken, refreshToken } = await AuthService.login(req.body);

            return success(res, "Login successful", {
                user,
                accessToken,
                refreshToken
            });
        } catch (err) {
            return error(res, err.message, 400);
        }
    },

    refreshToken: async (req, res) => {
        try {
            const { token } = req.body;

            const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

            const newAccessToken = generateAccessToken({ id: payload.id });

            return success(res, "Token refreshed", {
                accessToken: newAccessToken
            });
        } catch {
            return error(res, "Invalid refresh token", 401);
        }
    }
};
