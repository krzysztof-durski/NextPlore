import express from "express";
import {
  registerUser,
  loginUser,
  sendVerificationEmailCode,
  verifyEmailCode,
  requestPasswordReset,
  resetPassword,
  resendPasswordResetCode,
} from "../controllers/user.controller.js";

const router = express.Router();

// User registration
router.post("/register", registerUser);

// User login
router.post("/login", loginUser);

// Email verification
router.post("/send-verification-code", sendVerificationEmailCode);
router.post("/verify-email", verifyEmailCode);

// Password reset
router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/resend-password-reset-code", resendPasswordResetCode);

export default router;
