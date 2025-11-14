import express from "express";
import dotenv from "dotenv";
import userRoutes from "./src/routes/user.route.js";
import countryRoutes from "./src/routes/country.route.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use("/api/users", userRoutes);
app.use("/api/countries", countryRoutes);

export default app;
