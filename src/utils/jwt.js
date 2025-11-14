import jwt from "jsonwebtoken";

// Get JWT secret from environment - required for security
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET is not defined in environment variables. This is required for security."
    );
  }
  return secret;
};

// Get JWT expiration from environment - required for configuration
const getJWTExpiresIn = () => {
  const expiresIn = process.env.JWT_EXPIRES_IN;
  if (!expiresIn) {
    throw new Error(
      "JWT_EXPIRES_IN is not defined in environment variables. This is required for configuration."
    );
  }
  return expiresIn;
};

// Generate JWT token
export const generateToken = (userId) => {
  const secret = getJWTSecret();
  const expiresIn = getJWTExpiresIn();

  return jwt.sign({ userId }, secret, {
    expiresIn,
  });
};

// Verify JWT token
export const verifyToken = (token) => {
  const secret = getJWTSecret();

  try {
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};
