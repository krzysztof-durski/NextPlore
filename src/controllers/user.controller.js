import User from "../models/user.js";
import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

const registerUser = asynchandler(async (req, res) => {
  const { fullname, username, email, password, phone_number, country_id } =
    req.body;

  // Check if all required fields are provided
  if (!fullname || !username || !email || !password) {
    throw new ApiError(400, "Please provide all required fields");
  }

  // Check if user with email already exists
  const existingUser = await User.findOne({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // Create new user
  const user = await User.create({
    fullname,
    username,
    email,
    password,
    phone_number: phone_number || null,
    country_id: country_id || null,
  });

  // Remove password from response
  const userResponse = {
    user_id: user.user_id,
    fullname: user.fullname,
    username: user.username,
    email: user.email,
    phone_number: user.phone_number,
    country_id: user.country_id,
    is_verified: user.is_verified,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };

  return res
    .status(201)
    .json(new ApiResponse(201, userResponse, "User registered successfully"));
});

export { registerUser };
