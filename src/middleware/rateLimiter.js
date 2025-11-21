import rateLimit from "express-rate-limit";

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200, // Max 200 requests per 15 minutes per IP
    message: "Too many requests, please try again later.",
});

export default limiter;
