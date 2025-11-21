import cors from "cors";

export const applyCORS = (app) => {
    app.use(
        cors({
            origin: "*",        // Change to your frontend URL in production
            methods: "GET,POST,PUT,PATCH,DELETE",
            allowedHeaders: "Content-Type, Authorization",
        })
    );
};
