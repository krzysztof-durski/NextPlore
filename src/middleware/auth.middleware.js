import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { verifyToken } from "../utils/jwt.js";
import User from "../models/user.js";

// Middleware to authenticate user using JWT token
export const authenticate = asynchandler(async (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Authorization token is required");
  }

  // Extract token from "Bearer <token>"
  const token = authHeader.substring(7);

  if (!token) {
    throw new ApiError(401, "Authorization token is required");
  }

  try {
    // Verify token
    const decoded = verifyToken(token);

    // Find user by userId from token
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // Check if user is active
    if (!user.is_active) {
      throw new ApiError(403, "Account is deactivated. Please contact support.");
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Invalid or expired token");
  }
});

// Optional middleware - doesn't throw error if no token, but attaches user if valid token exists
export const optionalAuthenticate = asynchandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.substring(7);

  if (!token) {
    return next();
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.userId);

    if (user && user.is_active) {
      req.user = user;
    }
  } catch (error) {
    // Silently fail for optional authentication
  }

  next();
});

