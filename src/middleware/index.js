import express from "express";
import logger from "./logger.js";
import { applySecurity } from "./security.middleware.js";
import { errorHandler } from "./error.middleware.js";
import rateLimiter from "./rateLimiter.js";
import { applyCORS } from "./cors.middleware.js";
import { requestId } from "./requestId.js";
import { applyCompression } from "./compression.middleware.js";
//import { notFoundHandler } from "./notFound.middleware.js";

export default function registerMiddlewares(app) {
    // Unique Request ID
    app.use(requestId);

    // Body Parsers
    app.use(express.json({ limit: "10mb" }));
    app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Security
    applySecurity(app);

    // Compression
    applyCompression(app);

    // CORS
    applyCORS(app);

    // Rate Limiter
    app.use(rateLimiter);

    // Logger
    app.use(logger);



    // 404 Handler
    // app.use(notFoundHandler);

    // Error Handler (last middleware)
    app.use(errorHandler);

    console.log("✅ All middlewares registered successfully");
}
