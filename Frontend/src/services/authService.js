import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await api.get("/users/me");
    return response.data.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to get user data");
  }
};

// Change username
export const changeUsername = async (newUsername, password) => {
  try {
    const response = await api.post("/users/change-username", {
      new_username: newUsername,
      password,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to change username"
    );
  }
};

// Change fullname
export const changeFullname = async (fullname, password) => {
  try {
    const response = await api.post("/users/change-fullname", {
      fullname,
      password,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to change fullname"
    );
  }
};

// Change password
export const changePassword = async (
  oldPassword,
  newPassword,
  repeatNewPassword
) => {
  try {
    const response = await api.post("/users/change-password", {
      old_password: oldPassword,
      new_password: newPassword,
      repeat_new_password: repeatNewPassword,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to change password"
    );
  }
};

// Change country
export const changeCountry = async (countryId) => {
  try {
    const response = await api.post("/users/change-country", {
      country_id: countryId,
    });
    return response.data.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Failed to change country"
    );
  }
};

// Account deletion
export const deleteAccount = {
  sendCode: async () => {
    try {
      const response = await api.post("/users/delete-account/send-code");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          "Failed to send deletion verification code"
      );
    }
  },
  verifyCode: async (code) => {
    try {
      const response = await api.post("/users/delete-account/verify-code", {
        code,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to verify deletion code"
      );
    }
  },
  resendCode: async () => {
    try {
      const response = await api.post("/users/delete-account/resend-code");
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to resend deletion code"
      );
    }
  },
  confirm: async (password) => {
    try {
      const response = await api.post("/users/delete-account/confirm", {
        password,
      });
      return response.data.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to delete account"
      );
    }
  },
};
