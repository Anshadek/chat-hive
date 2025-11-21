import express from "express";
import dotenv from "dotenv";
import applyMiddlewares from "../middleware/index.js";
import routes from "../routes/api.routes.js";

dotenv.config();

const app = express();

// Apply Global Middlewares
applyMiddlewares(app);

// Base API Routes
app.use("/api", routes);

// Health Check Route
app.get("/", (req, res) => {
    res.send("Chat-Hive API is running!");
});

export default app;
