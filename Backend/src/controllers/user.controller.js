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

  if (password !== repeat_password) {
    throw new ApiError(400, "Passwords do not match");
  }

  const existingUser = await User.findOne({
    where: { email },
    paranoid: true,
  });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // check for soft-deleted user with this email and if there is, permanently delete it
  const deletedUser = await User.findOne({
    where: { email },
    paranoid: false,
  });

  if (deletedUser) {
    await deletedUser.destroy({ force: true });
  }

  const countryId = parseInt(country, 10);
  if (isNaN(countryId)) {
    throw new ApiError(400, "Invalid country ID");
  }

  const countryRecord = await Country.findByPk(countryId);
  if (!countryRecord) {
    throw new ApiError(404, "Country not found");
  }

  const birthDate = new Date(date_of_birth);

  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  // if birthday not occurred this year yet, adjust age
  const isAdult =
    age > 18 ||
    (age === 18 && (monthDiff > 0 || (monthDiff === 0 && dayDiff >= 0)));

  const user = await User.create({
    fullname,
    username,
    email,
    date_of_birth,
    country_id: countryId,
    password, // hashed automatically
    is_adult: isAdult,
  });

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

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.is_active) {
    throw new ApiError(403, "Account is deactivated. Please contact support.");
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (!user.is_verified) {
    throw new ApiError(
      403,
      "Email verification required. Please verify your email before logging in."
    );
  }

  const accessToken = generateAccessToken(user.user_id);
  const refreshToken = generateRefreshToken(user.user_id);

  await user.update({ refresh_token: refreshToken });

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

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.is_verified) {
    throw new ApiError(400, "Email is already verified");
  }

  const verificationCode = crypto.randomInt(100000, 1000000).toString();

  // set expiration time (10 min)
  const verificationCodeExpires = new Date();
  verificationCodeExpires.setMinutes(verificationCodeExpires.getMinutes() + 10);

  await user.update({
    verification_code: verificationCode,
    verification_code_expires: verificationCodeExpires,
  });

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

  if (!email || !code) {
    throw new ApiError(400, "Email and verification code are required");
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (user.is_verified) {
    throw new ApiError(400, "Email is already verified");
  }

  if (!user.verification_code) {
    throw new ApiError(
      400,
      "No verification code found. Please request a new one."
    );
  }

  if (new Date() > new Date(user.verification_code_expires)) {
    throw new ApiError(
      400,
      "Verification code has expired. Please request a new one."
    );
  }

  if (
    !crypto.timingSafeEqual(
      Buffer.from(user.verification_code),
      Buffer.from(code)
    )
  ) {
    throw new ApiError(400, "Invalid verification code");
  }

  await user.update({
    is_verified: true,
    verification_code: null,
    verification_code_expires: null,
  });

  // generate JWT access and refresh tokens to log user in after verification
  const accessToken = generateAccessToken(user.user_id);
  const refreshToken = generateRefreshToken(user.user_id);

  await user.update({ refresh_token: refreshToken });

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

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  // find user by email, don't reveal if account exists but is deactivated
  const user = await User.findOne({ where: { email } });
  if (!user) {
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

  // check if user is active, don't reveal if account exists but is deactivated
  if (!user.is_active) {
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

  const resetCode = crypto.randomInt(100000, 1000000).toString();

  // set expiration (10 min)
  const resetCodeExpires = new Date();
  resetCodeExpires.setMinutes(resetCodeExpires.getMinutes() + 10);

  await user.update({
    password_reset_token: resetCode,
    password_reset_expires: resetCodeExpires,
  });

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

  if (!email || !code || !new_password || !repeat_new_password) {
    throw new ApiError(
      400,
      "Email, code, new password, and repeat new password are required"
    );
  }

  if (new_password !== repeat_new_password) {
    throw new ApiError(400, "Passwords do not match");
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.password_reset_token) {
    throw new ApiError(
      400,
      "No password reset code found. Please request a new one."
    );
  }

  if (new Date() > new Date(user.password_reset_expires)) {
    throw new ApiError(400, "Password reset code has expired");
  }

  // verify the code using timing-safe comparison
  if (!user.password_reset_token || !code) {
    throw new ApiError(400, "Invalid password reset code");
  }

  const storedTokenBuffer = Buffer.from(user.password_reset_token, "utf8");
  const providedCodeBuffer = Buffer.from(code, "utf8");

  // ensure both buffers are the same length to avoid leaking length information
  const maxLength = Math.max(
    storedTokenBuffer.length,
    providedCodeBuffer.length
  );
  const zeroedBuffer = Buffer.alloc(maxLength, 0);

  // pad both buffers to the same length for timing-safe comparison
  const paddedStoredToken = Buffer.concat([
    storedTokenBuffer,
    zeroedBuffer.slice(storedTokenBuffer.length),
  ]);
  const paddedProvidedCode = Buffer.concat([
    providedCodeBuffer,
    zeroedBuffer.slice(providedCodeBuffer.length),
  ]);

  // perform timing-safe comparison
  if (!crypto.timingSafeEqual(paddedStoredToken, paddedProvidedCode)) {
    throw new ApiError(400, "Invalid password reset code");
  }

  // clear reset tokens immediately after successful validation to prevent reuse
  // also clear refresh token for security (user needs to login again)
  await user.update({
    password_reset_token: null,
    password_reset_expires: null,
    refresh_token: null,
  });

  await user.update({
    password: new_password, // password will be hashed automatically by the beforeUpdate hook
  });

  // return success message without token - user needs to login manually
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

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!user.is_active) {
    throw new ApiError(403, "Account is deactivated. Please contact support.");
  }

  const resetCode = crypto.randomInt(100000, 1000000).toString();

  // set expiration time (10 minutes from now)
  const resetCodeExpires = new Date();
  resetCodeExpires.setMinutes(resetCodeExpires.getMinutes() + 10);

  await user.update({
    password_reset_token: resetCode,
    password_reset_expires: resetCodeExpires,
  });

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
  const user = req.user;

  const { old_password, new_password, repeat_new_password } = req.body;

  if (!old_password || !new_password || !repeat_new_password) {
    throw new ApiError(
      400,
      "Old password, new password, and repeat new password are required"
    );
  }

  if (new_password !== repeat_new_password) {
    throw new ApiError(400, "New passwords do not match");
  }

  if (old_password === new_password) {
    throw new ApiError(
      400,
      "New password must be different from the old password"
    );
  }

  const isOldPasswordValid = await user.comparePassword(old_password);
  if (!isOldPasswordValid) {
    throw new ApiError(401, "Invalid old password");
  }

  // update password (password will be hashed automatically by the beforeUpdate hook)
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
  const user = req.user;

  await user.reload({ include: [{ model: Country, as: "country" }] });

  const userResponse = {
    user_id: user.user_id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    date_of_birth: user.date_of_birth,
    country_id: user.country_id,
    country_name: user.country ? user.country.country_name : null,
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
  const user = req.user;

  const { new_username, password } = req.body;

  if (!new_username || !password) {
    throw new ApiError(400, "New username and password are required");
  }

  if (new_username.length > 32) {
    throw new ApiError(400, "Username must be 32 characters or less");
  }

  if (new_username.trim().length === 0) {
    throw new ApiError(400, "Username cannot be empty");
  }

  if (user.username === new_username.trim()) {
    throw new ApiError(
      400,
      "New username must be different from the current username"
    );
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  await user.update({
    username: new_username.trim(),
  });

  // reload user with country association for response
  await user.reload({ include: [{ model: Country, as: "country" }] });

  const userResponse = {
    user_id: user.user_id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    date_of_birth: user.date_of_birth,
    country_id: user.country_id,
    country_name: user.country ? user.country.country_name : null,
    is_verified: user.is_verified,
    is_adult: user.is_adult,
    updated_at: user.updated_at,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, userResponse, "Username changed successfully"));
});

const changeFullname = asynchandler(async (req, res) => {
  const user = req.user;

  const { fullname, password } = req.body;

  if (!fullname || !password) {
    throw new ApiError(400, "Fullname and password are required");
  }

  if (fullname.length > 255) {
    throw new ApiError(400, "Fullname must be 255 characters or less");
  }

  if (fullname.trim().length === 0) {
    throw new ApiError(400, "Fullname cannot be empty");
  }

  if (user.fullname === fullname.trim()) {
    throw new ApiError(
      400,
      "New fullname must be different from the current fullname"
    );
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  await user.update({
    fullname: fullname.trim(),
  });

  await user.reload({ include: [{ model: Country, as: "country" }] });

  const userResponse = {
    user_id: user.user_id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    date_of_birth: user.date_of_birth,
    country_id: user.country_id,
    country_name: user.country ? user.country.country_name : null,
    is_verified: user.is_verified,
    is_adult: user.is_adult,
    updated_at: user.updated_at,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, userResponse, "Fullname changed successfully"));
});

const changeCountry = asynchandler(async (req, res) => {
  const user = req.user;

  const { country_id } = req.body;

  if (!country_id) {
    throw new ApiError(400, "Country ID is required");
  }

  const newCountryId = parseInt(country_id, 10);
  if (isNaN(newCountryId)) {
    throw new ApiError(400, "Invalid country ID");
  }

  if (user.country_id === newCountryId) {
    throw new ApiError(
      400,
      "New country must be different from the current country"
    );
  }

  const countryRecord = await Country.findByPk(newCountryId);
  if (!countryRecord) {
    throw new ApiError(404, "Country not found");
  }

  await user.update({
    country_id: newCountryId,
  });

  await user.reload({ include: [{ model: Country, as: "country" }] });

  const userResponse = {
    user_id: user.user_id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    date_of_birth: user.date_of_birth,
    country_id: user.country_id,
    country_name: user.country ? user.country.country_name : null,
    is_verified: user.is_verified,
    is_adult: user.is_adult,
    updated_at: user.updated_at,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, userResponse, "Country changed successfully"));
});

const logoutUser = asynchandler(async (req, res) => {
  const user = req.user;

  await user.update({ refresh_token: null });

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Logged out successfully"));
});

const refreshToken = asynchandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.findByPk(decoded.userId);
    if (!user) {
      throw new ApiError(401, "User not found");
    }

    if (!user.is_active) {
      throw new ApiError(
        403,
        "Account is deactivated. Please contact support."
      );
    }

    if (!user.is_verified) {
      throw new ApiError(
        403,
        "Email verification required. Please verify your email to continue."
      );
    }

    if (user.refresh_token !== refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const newAccessToken = generateAccessToken(user.user_id);
    const newRefreshToken = generateRefreshToken(user.user_id);

    await user.update({ refresh_token: newRefreshToken });

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

// account deletion controllers

const sendAccountDeletionVerificationCode = asynchandler(async (req, res) => {
  const user = req.user;

  if (!user.is_active) {
    throw new ApiError(403, "Account is deactivated. Please contact support.");
  }

  const deletionCode = crypto.randomInt(100000, 1000000).toString();

  // set expiration time (10 minutes from now)
  const deletionCodeExpires = new Date();
  deletionCodeExpires.setMinutes(deletionCodeExpires.getMinutes() + 10);

  // reset verification flag when requesting a new code
  await user.update({
    account_deletion_code: deletionCode,
    account_deletion_code_expires: deletionCodeExpires,
    account_deletion_verified: false,
  });

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
  const user = req.user;

  const { code } = req.body;

  if (!code) {
    throw new ApiError(400, "Verification code is required");
  }

  if (!user.account_deletion_code) {
    throw new ApiError(
      400,
      "No account deletion verification code found. Please request a new one."
    );
  }

  if (new Date() > new Date(user.account_deletion_code_expires)) {
    throw new ApiError(
      400,
      "Account deletion verification code has expired. Please request a new one."
    );
  }

  if (
    !crypto.timingSafeEqual(
      Buffer.from(user.account_deletion_code),
      Buffer.from(code)
    )
  ) {
    throw new ApiError(400, "Invalid account deletion verification code");
  }

  // this allows user to proceed to password confirmation
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
  const user = req.user;

  if (!user.is_active) {
    throw new ApiError(403, "Account is deactivated. Please contact support.");
  }

  const deletionCode = crypto.randomInt(100000, 1000000).toString();

  // set expiration time (10 minutes from now)
  const deletionCodeExpires = new Date();
  deletionCodeExpires.setMinutes(deletionCodeExpires.getMinutes() + 10);

  // reset verification flag when requesting a new code
  await user.update({
    account_deletion_code: deletionCode,
    account_deletion_code_expires: deletionCodeExpires,
    account_deletion_verified: false,
  });

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
        "Account deletion verification email resent successfully"
      )
    );
});

const confirmAccountDeletion = asynchandler(async (req, res) => {
  const user = req.user;

  const { password } = req.body;

  if (!password) {
    throw new ApiError(400, "Password is required to confirm account deletion");
  }

  if (!user.account_deletion_verified) {
    throw new ApiError(
      400,
      "Please verify your email first by completing the verification code step"
    );
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }

  // clear refresh token and deactivate account before deletion
  await user.update({
    is_active: false,
    refresh_token: null,
  });

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
