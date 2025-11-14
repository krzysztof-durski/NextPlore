import express from "express";
import dotenv from "dotenv";
import userRoutes from "./src/routes/user.route.js";
import countryRoutes from "./src/routes/country.route.js";
import locationRoutes from "./src/routes/locations.route.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "Server is running" });
});

// Routes
app.use("/api/users", userRoutes);
app.use("/api/countries", countryRoutes);
app.use("/api/locations", locationRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ status, message });
});

export default app;
