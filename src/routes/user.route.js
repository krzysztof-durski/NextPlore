import express from "express";
import {
  registerUser,
  loginUser,
  sendVerificationEmailCode,
  verifyEmailCode,
  requestPasswordReset,
  resetPassword,
  resendPasswordResetCode,
  changePassword,
  getCurrentUser,
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// User registration
router.post("/register", registerUser);

// User login
router.post("/login", loginUser);

// Email verification (no auth required - user may not be logged in)
router.post("/send-verification-code", sendVerificationEmailCode);
router.post("/verify-email", verifyEmailCode);

// Password reset (no auth required - user forgot password)
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/resend-password-reset-code", resendPasswordResetCode);

// Protected routes (require JWT authentication)
router.get("/me", authenticate, getCurrentUser);
router.post("/change-password", authenticate, changePassword);

export default router;
