import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  requestPasswordReset,
  resetPassword,
  resendPasswordResetCode,
} from "../services/authService";
import "../styles/ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendingCode, setResendingCode] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (!email) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    try {
      await requestPasswordReset(email);
      setSuccessMessage("Password reset code sent! Please check your email.");
      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send password reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setResendingCode(true);

    try {
      await resendPasswordResetCode(email);
      setSuccessMessage("Password reset code resent successfully!");
    } catch (err) {
      setError(err.message || "Failed to resend password reset code");
    } finally {
      setResendingCode(false);
    }
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (!code || !newPassword || !repeatPassword) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (newPassword !== repeatPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await resetPassword(email, code, newPassword, repeatPassword);
      setSuccessMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login", {
          state: {
            message: "Password reset successfully! Please login with your new password.",
          },
        });
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        {/* Step 1: Enter Email */}
        <div className={`step-container ${step === 1 ? "active" : ""}`}>
          <div className="step-content">
            <div className="logo-container">
              <h1 className="logo-text">NEXTPLORE</h1>
            </div>
            <h3 className="form-title">Reset Your Password</h3>
            <p className="form-instruction">
              Enter email associated with your account
            </p>
            <form onSubmit={handleStep1Submit} className="forgot-password-form">
              <div className="form-group">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="EMAIL"
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>
              {error && step === 1 && (
                <div className="error-message">{error}</div>
              )}
              {successMessage && step === 1 && (
                <div className="success-message">{successMessage}</div>
              )}
              <button
                type="submit"
                className="confirm-btn"
                disabled={loading || !email}
              >
                {loading ? "Sending..." : "Confirm"}
              </button>
            </form>
            <div className="divider">
              <span>or</span>
            </div>
            <Link to="/login" className="login-link-btn">
              login
            </Link>
          </div>
        </div>

        {/* Step 2: Enter Code and New Password */}
        <div className={`step-container ${step === 2 ? "active" : ""}`}>
          <div className="step-content">
            <div className="logo-container">
              <h1 className="logo-text">NEXTPLORE</h1>
            </div>
            <h3 className="form-title">Set up new password</h3>
            <form onSubmit={handleStep2Submit} className="forgot-password-form">
              <div className="form-group">
                <input
                  type="text"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="code from email"
                  className="form-input code-input"
                  maxLength="6"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="new password"
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <input
                  type="password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  placeholder="repeat new password"
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>
              {error && step === 2 && (
                <div className="error-message">{error}</div>
              )}
              {successMessage && step === 2 && (
                <div className="success-message">{successMessage}</div>
              )}
              <div className="button-group">
                <button
                  type="button"
                  onClick={handleResendCode}
                  className="resend-btn"
                  disabled={loading || resendingCode}
                >
                  {resendingCode ? "Resending..." : "Resend code"}
                </button>
                <button
                  type="submit"
                  className="confirm-btn"
                  disabled={
                    loading ||
                    !code ||
                    code.length !== 6 ||
                    !newPassword ||
                    !repeatPassword
                  }
                >
                  {loading ? "Resetting..." : "Confirm"}
                </button>
              </div>
            </form>
            <div className="divider">
              <span>or</span>
            </div>
            <Link to="/login" className="login-link-btn">
              login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

