import jwt from "jsonwebtoken";

// Get JWT access token secret from environment - required for security
const getJWTAccessSecret = () => {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_ACCESS_SECRET is not defined in environment variables. This is required for security."
    );
  }
  return secret;
};

// Get JWT refresh token secret from environment - required for security
const getJWTRefreshSecret = () => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_REFRESH_SECRET is not defined in environment variables. This is required for security."
    );
  }
  return secret;
};

// Get JWT access token expiration from environment - required for configuration
const getJWTAccessExpiresIn = () => {
  const expiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
  return expiresIn;
};

// Get JWT refresh token expiration from environment - required for configuration
const getJWTRefreshExpiresIn = () => {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
  return expiresIn;
};

// Generate JWT access token (short-lived)
export const generateAccessToken = (userId) => {
  const secret = getJWTAccessSecret();
  const expiresIn = getJWTAccessExpiresIn();

  return jwt.sign({ userId }, secret, {
    expiresIn,
  });
};

// Generate JWT refresh token (long-lived)
export const generateRefreshToken = (userId) => {
  const secret = getJWTRefreshSecret();
  const expiresIn = getJWTRefreshExpiresIn();

  return jwt.sign({ userId }, secret, {
    expiresIn,
  });
};

// Verify JWT access token
export const verifyAccessToken = (token) => {
  const secret = getJWTAccessSecret();

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
};

// Verify JWT refresh token
export const verifyRefreshToken = (token) => {
  const secret = getJWTRefreshSecret();

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};
