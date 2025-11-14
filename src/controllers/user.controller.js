import User from "../models/user.js";
import Country from "../models/country.js";
import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { sendVerificationEmail } from "../utils/emailService.js";

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
  const userResponse = {
    user_id: user.user_id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    date_of_birth: user.date_of_birth,
    country_id: user.country_id,
    created_at: user.created_at,
  };

  return res
    .status(201)
    .json(new ApiResponse(201, userResponse, "User registered successfully"));
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
  const verificationCode = Math.floor(
    100000 + Math.random() * 900000
  ).toString();

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
  if (user.verification_code !== code) {
    throw new ApiError(400, "Invalid verification code");
  }

  // Update user to verified and clear verification code
  await user.update({
    is_verified: true,
    verification_code: null,
    verification_code_expires: null,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { email: user.email, is_verified: true },
        "Email verified successfully"
      )
    );
});

export { registerUser, sendVerificationEmailCode, verifyEmailCode };
