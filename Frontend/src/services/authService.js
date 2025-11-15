import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const login = async (email, password) => {
  try {
    const response = await api.post("/users/login", {
      email,
      password,
    });
    const { accessToken, refreshToken, ...userData } = response.data.data;

    // Store tokens in localStorage
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    return { user: userData, accessToken, refreshToken };
  } catch (error) {
    throw new Error(error.response?.data?.message || "Login failed");
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post("/users/register", {
      fullname: userData.fullname,
      username: userData.username,
      email: userData.email,
      date_of_birth: userData.date_of_birth,
      country: userData.country,
      password: userData.password,
      repeat_password: userData.repeat_password,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Registration failed");
  }
};

export const logout = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("accessToken");
};

export const sendVerificationCode = async (email) => {
  try {
    const response = await api.post("/users/send-verification-code", {
      email,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to send verification code"
    );
  }
};

export const verifyEmailCode = async (email, code) => {
  try {
    const response = await api.post("/users/verify-email", {
      email,
      code,
    });
    const { accessToken, refreshToken, ...userData } = response.data.data;

    // Store tokens in localStorage
    if (accessToken && refreshToken) {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
    }

    return { user: userData, accessToken, refreshToken };
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Email verification failed"
    );
  }
};
