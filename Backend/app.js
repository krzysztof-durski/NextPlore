import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./src/routes/user.route.js";
import countryRoutes from "./src/routes/country.route.js";
import locationRoutes from "./src/routes/locations.route.js";
import tagRoutes from "./src/routes/tag.route.js";

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      "http://localhost:3000",
      "http://localhost:5173", // Vite default port
      "http://localhost:5174", // Vite alternate port
    ].filter(Boolean); // Remove undefined values
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins in development (change in production)
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Middleware
app.use(cors(corsOptions));
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
app.use("/api/tags", tagRoutes);

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
