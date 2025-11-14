import User from "../models/user.js";
import Country from "../models/country.js";
import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

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

export { registerUser };
