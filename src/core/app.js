import express from "express";
import dotenv from "dotenv";
import applyMiddlewares from "../middleware/index.js";
import routes from "../routes/api.routes.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Apply global middlewares
applyMiddlewares(app);

// Base API routes
app.use("/api", routes);

// Serve public UI (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, "../../public")));

// Serve uploaded assets
app.use('/uploads', express.static(path.join(process.cwd(), 'src', 'uploads')));

// Health check / default route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../public", "signin.html"));
});

export default app;
