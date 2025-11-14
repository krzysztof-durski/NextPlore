import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { verifyAccessToken } from "../utils/jwt.js";
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
    // Verify access token
    const decoded = verifyAccessToken(token);

    // Find user by userId from token
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      throw new ApiError(401, "User not found");
    }

    // Check if user is active
    if (!user.is_active) {
      throw new ApiError(
        403,
        "Account is deactivated. Please contact support."
      );
    }

    // Check if user email is verified
    if (!user.is_verified) {
      throw new ApiError(
        403,
        "Email verification required. Please verify your email to access this resource."
      );
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
