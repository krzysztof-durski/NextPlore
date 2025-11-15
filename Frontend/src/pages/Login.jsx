import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { login } from "../services/authService";
import "../styles/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    // Check if redirected from registration
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      // Navigate to home page on successful login
      navigate("/");
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo */}
        <div className="logo-container">
          <h1 className="logo-text">NEXTPLORE</h1>
        </div>

        {/* Login Form */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email"
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              className="form-input"
              required
              disabled={loading}
            />
            <Link to="/forgot-password" className="forgot-password-link">
              forgot password
            </Link>
          </div>

          {successMessage && (
            <div className="success-message">{successMessage}</div>
          )}
          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "LOGGING IN..." : "login"}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <Link to="/register" className="register-btn">
            register
          </Link>
        </form>
      </div>
    </div>
  );
}
