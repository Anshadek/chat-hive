// src/middleware/security.middleware.js
import helmet from "helmet";
//import mongoSanitize from "express-mongo-sanitize";
import cors from "cors";

export const applySecurity = (app) => {

    // Secure headers
    app.use(helmet());

    // Prevent NoSQL injection
    // app.use(mongoSanitize());

    // CORS settings (customize domains when needed)
    app.use(cors({
        origin: "*",
        methods: "GET,POST,PUT,PATCH,DELETE",
        allowedHeaders: "Content-Type,Authorization",
    }));
};
