import crypto from "crypto";
import User from "../models/user.js";
import Country from "../models/country.js";
import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import {
  sendVerificationEmail,
  sendPasswordResetCode,
  sendAccountDeletionCode,
} from "../utils/emailService.js";

const registerUser = asynchandler(async (req, res) => {
  const {
    fullname,
    username,
    email,
    date_of_birth,
    country,
    password,
    repeat_password,
  } = req.body;

  // Validate required fields
  if (
    !fullname ||
    !username ||
    !email ||
    !date_of_birth ||
    !country ||
    !password ||
    !repeat_password
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Validate password match
  if (password !== repeat_password) {
    throw new ApiError(400, "Passwords do not match");
  }

  // Check if user with email already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // Validate country_id exists (country is selected from dropdown)
  const countryId = parseInt(country, 10);
  if (isNaN(countryId)) {
    throw new ApiError(400, "Invalid country ID");
  }

  const countryRecord = await Country.findByPk(countryId);
  if (!countryRecord) {
    throw new ApiError(404, "Country not found");
  }

  // Calculate if user is adult (18 years or older)
  const birthDate = new Date(date_of_birth);

  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  // Adjust age if birthday hasn't occurred this year yet
  const isAdult =
    age > 18 ||
    (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));

  // Create user
  const user = await User.create({
    fullname,
    username,
    email,
    date_of_birth,
    country_id: countryId,
    password, // Password will be hashed automatically by the beforeCreate hook
    is_adult: isAdult,
  });

  // Return success response (exclude password from response)
  // Note!!!: Tokens are NOT generated here - they will be generated after email verification
  const userResponse = {
    user_id: user.user_id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    date_of_birth: user.date_of_birth,
    country_id: user.country_id,
    is_verified: user.is_verified,
    is_adult: user.is_adult,
    created_at: user.created_at,
  };

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        userResponse,
        "User registered successfully. Please verify your email to continue."
      )
    );
});

const loginUser = asynchandler(async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Check if user is active
  if (!user.is_active) {
    throw new ApiError(403, "Account is deactivated. Please contact support.");
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  // Check if user email is verified
  if (!user.is_verified) {
    throw new ApiError(
      403,
      "Email verification required. Please verify your email before logging in."
    );
  }

  // Generate JWT access and refresh tokens (only for verified users)
  const accessToken = generateAccessToken(user.user_id);
  const refreshToken = generateRefreshToken(user.user_id);

  // Store refresh token in database
  await user.update({ refresh_token: refreshToken });

  // Return user data (exclude password)
  const userResponse = {
    user_id: user.user_id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    date_of_birth: user.date_of_birth,
    country_id: user.country_id,
    is_verified: user.is_verified,
    is_adult: user.is_adult,
    created_at: user.created_at,
    accessToken,
    refreshToken,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, userResponse, "Login successful"));
});

const sendVerificationEmailCode = asynchandler(async (req, res) => {
  const { email } = req.body;

  // Validate email is provided
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if user is already verified
  if (user.is_verified) {
    throw new ApiError(400, "Email is already verified");
  }

  // Generate 6-digit verification code
  const verificationCode = crypto.randomInt(100000, 1000000).toString();

  // Set expiration time (10 minutes from now)
  const verificationCodeExpires = new Date();
  verificationCodeExpires.setMinutes(verificationCodeExpires.getMinutes() + 10);

  // Save verification code and expiration to user
  await user.update({
    verification_code: verificationCode,
    verification_code_expires: verificationCodeExpires,
  });

  // Send verification email
  try {
    await sendVerificationEmail(email, verificationCode);
  } catch (error) {
    throw new ApiError(500, "Failed to send verification email");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email: user.email },
        "Verification email sent successfully"
      )
    );
});

const verifyEmailCode = asynchandler(async (req, res) => {
  const { email, code } = req.body;

  // Validate required fields
  if (!email || !code) {
    throw new ApiError(400, "Email and verification code are required");
  }

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if user is already verified
  if (user.is_verified) {
    throw new ApiError(400, "Email is already verified");
  }

  // Check if verification code exists
  if (!user.verification_code) {
    throw new ApiError(
      400,
      "No verification code found. Please request a new one."
    );
  }

  // Check if verification code has expired
  if (new Date() > new Date(user.verification_code_expires)) {
    throw new ApiError(
      400,
      "Verification code has expired. Please request a new one."
    );
  }

  // Verify the code
  if (
    !crypto.timingSafeEqual(
      Buffer.from(user.verification_code),
      Buffer.from(code)
    )
  ) {
    throw new ApiError(400, "Invalid verification code");
  }

  // Update user to verified and clear verification code
  await user.update({
    is_verified: true,
    verification_code: null,
    verification_code_expires: null,
  });

  // Generate JWT access and refresh tokens to automatically log user in after verification
  const accessToken = generateAccessToken(user.user_id);
  const refreshToken = generateRefreshToken(user.user_id);

  // Store refresh token in database
  await user.update({ refresh_token: refreshToken });

  // Return user data with tokens (exclude password)
  const userResponse = {
    user_id: user.user_id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    date_of_birth: user.date_of_birth,
    country_id: user.country_id,
    is_verified: true,
    is_adult: user.is_adult,
    accessToken,
    refreshToken,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, userResponse, "Email verified successfully"));
});

const requestPasswordReset = asynchandler(async (req, res) => {
  const { email } = req.body;

  // Validate email is provided
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    // For security, don't reveal if email exists or not
    // Return success message even if user doesn't exist
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { email },
          "If an account with this email exists, a password reset code has been sent"
        )
      );
  }

  // Check if user is active
  if (!user.is_active) {
    throw new ApiError(403, "Account is deactivated. Please contact support.");
  }

  // Generate 6-digit reset code
  const resetCode = crypto.randomInt(100000, 1000000).toString();

  // Set expiration time (10 minutes from now)
  const resetCodeExpires = new Date();
  resetCodeExpires.setMinutes(resetCodeExpires.getMinutes() + 10);

  // Save reset code and expiration to user
  await user.update({
    password_reset_token: resetCode,
    password_reset_expires: resetCodeExpires,
  });

  // Send password reset email
  try {
    await sendPasswordResetCode(email, resetCode);
  } catch (error) {
    throw new ApiError(500, "Failed to send password reset email");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email: user.email },
        "Password reset code sent successfully"
      )
    );
});

const resetPassword = asynchandler(async (req, res) => {
  const { email, code, new_password, repeat_new_password } = req.body;

  // Validate required fields
  if (!email || !code || !new_password || !repeat_new_password) {
    throw new ApiError(
      400,
      "Email, code, new password, and repeat new password are required"
    );
  }

  // Validate password match
  if (new_password !== repeat_new_password) {
    throw new ApiError(400, "Passwords do not match");
  }

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if reset code exists
  if (!user.password_reset_token) {
    throw new ApiError(
      400,
      "No password reset code found. Please request a new one."
    );
  }

  // Check if reset code has expired
  if (new Date() > new Date(user.password_reset_expires)) {
    throw new ApiError(400, "Password reset code has expired");
  }

  // Verify the code
  if (user.password_reset_token !== code) {
    throw new ApiError(400, "Invalid password reset code");
  }

  // Clear reset tokens immediately after successful validation to prevent reuse
  // Also clear refresh token for security (user needs to login again)
  await user.update({
    password_reset_token: null,
    password_reset_expires: null,
    refresh_token: null,
  });

  // Update password (tokens already cleared above)
  await user.update({
    password: new_password, // Password will be hashed automatically by the beforeUpdate hook
  });

  // Return success message without token - user needs to login manually
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email: user.email },
        "Password reset successfully. Please login with your new password."
      )
    );
});

const resendPasswordResetCode = asynchandler(async (req, res) => {
  const { email } = req.body;

  // Validate email is provided
  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if user is active
  if (!user.is_active) {
    throw new ApiError(403, "Account is deactivated. Please contact support.");
  }

  // Generate new 6-digit reset code
  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

  // Set expiration time (10 minutes from now)
  const resetCodeExpires = new Date();
  resetCodeExpires.setMinutes(resetCodeExpires.getMinutes() + 10);

  // Save reset code and expiration to user
  await user.update({
    password_reset_token: resetCode,
    password_reset_expires: resetCodeExpires,
  });

  // Send password reset email
  try {
    await sendPasswordResetCode(email, resetCode);
  } catch (error) {
    throw new ApiError(500, "Failed to send password reset email");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email: user.email },
        "Password reset code resent successfully"
      )
    );
});

const changePassword = asynchandler(async (req, res) => {
  // Get user from JWT authentication middleware
  const user = req.user;

  const { old_password, new_password, repeat_new_password } = req.body;

  // Validate required fields
  if (!old_password || !new_password || !repeat_new_password) {
    throw new ApiError(
      400,
      "Old password, new password, and repeat new password are required"
    );
  }

  // Validate password match
  if (new_password !== repeat_new_password) {
    throw new ApiError(400, "New passwords do not match");
  }

  // Validate that new password is different from old password
  if (old_password === new_password) {
    throw new ApiError(
      400,
      "New password must be different from the old password"
    );
  }

  // Verify old password
  const isOldPasswordValid = await user.comparePassword(old_password);
  if (!isOldPasswordValid) {
    throw new ApiError(401, "Invalid old password");
  }

  // Update password (password will be hashed automatically by the beforeUpdate hook)
  await user.update({
    password: new_password,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email: user.email },
        "Password changed successfully"
      )
    );
});

const getCurrentUser = asynchandler(async (req, res) => {
  // Get user from JWT authentication middleware
  const user = req.user;

  // Return user data (exclude password)
  const userResponse = {
    user_id: user.user_id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    date_of_birth: user.date_of_birth,
    country_id: user.country_id,
    phone_number: user.phone_number,
    is_verified: user.is_verified,
    is_adult: user.is_adult,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, userResponse, "User retrieved successfully"));
});

const changeUsername = asynchandler(async (req, res) => {
  // Get user from JWT authentication middleware
  const user = req.user;

  const { new_username, password } = req.body;

  // Validate required fields
  if (!new_username || !password) {
    throw new ApiError(400, "New username and password are required");
  }

  // Validate username length (matching model constraint)
  if (new_username.length > 32) {
    throw new ApiError(400, "Username must be 32 characters or less");
  }

  if (new_username.trim().length === 0) {
    throw new ApiError(400, "Username cannot be empty");
  }

  // Check if new username is different from current username
  if (user.username === new_username.trim()) {
    throw new ApiError(
      400,
      "New username must be different from the current username"
    );
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  // Update username
  await user.update({
    username: new_username.trim(),
  });

  // Return updated user data (exclude password)
  const userResponse = {
    user_id: user.user_id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    date_of_birth: user.date_of_birth,
    country_id: user.country_id,
    is_verified: user.is_verified,
    is_adult: user.is_adult,
    updated_at: user.updated_at,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, userResponse, "Username changed successfully"));
});

const changeFullname = asynchandler(async (req, res) => {
  // Get user from JWT authentication middleware
  const user = req.user;

  const { fullname, password } = req.body;

  // Validate required fields
  if (!fullname || !password) {
    throw new ApiError(400, "Fullname and password are required");
  }

  // Validate fullname length (matching model constraint)
  if (fullname.length > 255) {
    throw new ApiError(400, "Fullname must be 255 characters or less");
  }

  if (fullname.trim().length === 0) {
    throw new ApiError(400, "Fullname cannot be empty");
  }

  // Check if new fullname is different from current fullname
  if (user.fullname === fullname.trim()) {
    throw new ApiError(
      400,
      "New fullname must be different from the current fullname"
    );
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  // Update fullname
  await user.update({
    fullname: fullname.trim(),
  });

  // Return updated user data (exclude password)
  const userResponse = {
    user_id: user.user_id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    date_of_birth: user.date_of_birth,
    country_id: user.country_id,
    is_verified: user.is_verified,
    is_adult: user.is_adult,
    updated_at: user.updated_at,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, userResponse, "Fullname changed successfully"));
});

const changeCountry = asynchandler(async (req, res) => {
  // Get user from JWT authentication middleware
  const user = req.user;

  const { country_id } = req.body;

  // Validate required fields
  if (!country_id) {
    throw new ApiError(400, "Country ID is required");
  }

  // Validate country_id is a valid integer
  const newCountryId = parseInt(country_id, 10);
  if (isNaN(newCountryId)) {
    throw new ApiError(400, "Invalid country ID");
  }

  // Check if new country is different from current country
  if (user.country_id === newCountryId) {
    throw new ApiError(
      400,
      "New country must be different from the current country"
    );
  }

  // Validate country exists
  const countryRecord = await Country.findByPk(newCountryId);
  if (!countryRecord) {
    throw new ApiError(404, "Country not found");
  }

  // Update country_id
  await user.update({
    country_id: newCountryId,
  });

  // Return updated user data (exclude password)
  const userResponse = {
    user_id: user.user_id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    date_of_birth: user.date_of_birth,
    country_id: user.country_id,
    is_verified: user.is_verified,
    is_adult: user.is_adult,
    updated_at: user.updated_at,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, userResponse, "Country changed successfully"));
});

const logoutUser = asynchandler(async (req, res) => {
  // Get user from JWT authentication middleware
  const user = req.user;

  // Clear refresh token from database
  await user.update({ refresh_token: null });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});

const refreshToken = asynchandler(async (req, res) => {
  const { refreshToken } = req.body;

  // Validate refresh token is provided
  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

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
        "Email verification required. Please verify your email to continue."
      );
    }

    // Verify that the refresh token matches the one stored in database
    if (user.refresh_token !== refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // Generate new access and refresh tokens
    const newAccessToken = generateAccessToken(user.user_id);
    const newRefreshToken = generateRefreshToken(user.user_id);

    // Update refresh token in database
    await user.update({ refresh_token: newRefreshToken });

    // Return new tokens
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        },
        "Tokens refreshed successfully"
      )
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(401, "Invalid or expired refresh token");
  }
});

// Account Deletion Controllers

const sendAccountDeletionVerificationCode = asynchandler(async (req, res) => {
  // Get user from JWT authentication middleware
  const user = req.user;

  // Check if user is active
  if (!user.is_active) {
    throw new ApiError(403, "Account is deactivated. Please contact support.");
  }

  // Generate 6-digit deletion verification code
  const deletionCode = crypto.randomInt(100000, 1000000).toString();

  // Set expiration time (10 minutes from now)
  const deletionCodeExpires = new Date();
  deletionCodeExpires.setMinutes(deletionCodeExpires.getMinutes() + 10);

  // Save deletion code and expiration to user
  // Reset verification flag when requesting a new code
  await user.update({
    account_deletion_code: deletionCode,
    account_deletion_code_expires: deletionCodeExpires,
    account_deletion_verified: false,
  });

  // Send account deletion verification email
  try {
    await sendAccountDeletionCode(user.email, deletionCode);
  } catch (error) {
    throw new ApiError(
      500,
      "Failed to send account deletion verification email"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email: user.email },
        "Account deletion verification email sent successfully"
      )
    );
});

const verifyAccountDeletionCode = asynchandler(async (req, res) => {
  // Get user from JWT authentication middleware
  const user = req.user;

  const { code } = req.body;

  // Validate required fields
  if (!code) {
    throw new ApiError(400, "Verification code is required");
  }

  // Check if deletion code exists
  if (!user.account_deletion_code) {
    throw new ApiError(
      400,
      "No account deletion verification code found. Please request a new one."
    );
  }

  // Check if deletion code has expired
  if (new Date() > new Date(user.account_deletion_code_expires)) {
    throw new ApiError(
      400,
      "Account deletion verification code has expired. Please request a new one."
    );
  }

  // Verify the code using timing-safe comparison
  if (
    !crypto.timingSafeEqual(
      Buffer.from(user.account_deletion_code),
      Buffer.from(code)
    )
  ) {
    throw new ApiError(400, "Invalid account deletion verification code");
  }

  // Code is valid - mark as verified and clear the code
  // This allows user to proceed to password confirmation
  await user.update({
    account_deletion_code: null,
    account_deletion_code_expires: null,
    account_deletion_verified: true,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { verified: true },
        "Account deletion verification code verified successfully. Please proceed to password confirmation."
      )
    );
});

const resendAccountDeletionCode = asynchandler(async (req, res) => {
  // Get user from JWT authentication middleware
  const user = req.user;

  // Check if user is active
  if (!user.is_active) {
    throw new ApiError(403, "Account is deactivated. Please contact support.");
  }

  // Generate new 6-digit deletion verification code
  const deletionCode = crypto.randomInt(100000, 1000000).toString();

  // Set expiration time (10 minutes from now)
  const deletionCodeExpires = new Date();
  deletionCodeExpires.setMinutes(deletionCodeExpires.getMinutes() + 10);

  // Save deletion code and expiration to user
  // Reset verification flag when requesting a new code
  await user.update({
    account_deletion_code: deletionCode,
    account_deletion_code_expires: deletionCodeExpires,
    account_deletion_verified: false,
  });

  // Send account deletion verification email
  try {
    await sendAccountDeletionCode(user.email, deletionCode);
  } catch (error) {
    throw new ApiError(
      500,
      "Failed to send account deletion verification email"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email: user.email },
        "Account deletion verification code resent successfully"
      )
    );
});

const confirmAccountDeletion = asynchandler(async (req, res) => {
  // Get user from JWT authentication middleware
  const user = req.user;

  const { password } = req.body;

  // Validate required fields
  if (!password) {
    throw new ApiError(400, "Password is required to confirm account deletion");
  }

  // Check if email verification step was completed
  if (!user.account_deletion_verified) {
    throw new ApiError(
      400,
      "Please verify your email first by completing the verification code step"
    );
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  // Password is valid - proceed with account deletion
  await user.update({
    is_active: false,
  });

  // soft delete
  await user.destroy();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { deleted: true },
        "Your account has been deleted successfully. All your data will be permanently deleted within 14 business days."
      )
    );
});

export {
  registerUser,
  loginUser,
  sendVerificationEmailCode,
  verifyEmailCode,
  requestPasswordReset,
  resetPassword,
  resendPasswordResetCode,
  changePassword,
  changeUsername,
  changeFullname,
  changeCountry,
  getCurrentUser,
  logoutUser,
  refreshToken,
  sendAccountDeletionVerificationCode,
  verifyAccountDeletionCode,
  resendAccountDeletionCode,
  confirmAccountDeletion,
};
