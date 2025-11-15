import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { sendVerificationCode, verifyEmailCode } from "../services/authService";
import "../styles/VerifyEmail.css";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    // Get email from location state (passed from register page)
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setError("");
    setSuccessMessage("");
    setSendingCode(true);

    try {
      await sendVerificationCode(email);
      setSuccessMessage("Verification code sent successfully! Please check your email.");
    } catch (err) {
      setError(err.message || "Failed to send verification code. Please try again.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);

    if (!email || !code) {
      setError("Please enter both email and verification code");
      setLoading(false);
      return;
    }

    try {
      const result = await verifyEmailCode(email, code);
      // Store tokens if provided (user is automatically logged in after verification)
      if (result.accessToken && result.refreshToken) {
        localStorage.setItem("accessToken", result.accessToken);
        localStorage.setItem("refreshToken", result.refreshToken);
      }
      // Navigate to home page after successful verification
      navigate("/", {
        state: {
          message: "Email verified successfully! You are now logged in.",
        },
      });
    } catch (err) {
      setError(err.message || "Verification failed. Please check your code and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-email-page">
      <div className="verify-email-container">
        {/* Logo */}
        <div className="logo-container">
          <h1 className="logo-text">NEXTPLORE</h1>
        </div>

        {/* Verify Email Form */}
        <div className="verify-email-form-container">
          <h2 className="verify-email-title">Verify Email</h2>

          {/* Send Verification Code Section */}
          <div className="form-section">
            <form onSubmit={handleSendCode} className="send-code-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="Enter your email"
                  required
                  disabled={loading || sendingCode}
                />
              </div>
              <button
                type="submit"
                className="send-code-btn"
                disabled={loading || sendingCode || !email}
              >
                {sendingCode ? "Sending..." : email ? `Send verification email to ${email}` : "Send verification email"}
              </button>
            </form>
          </div>

          {/* Verify Code Section */}
          <div className="form-section">
            <form onSubmit={handleVerify} className="verify-code-form">
              <div className="form-group">
                <label htmlFor="code" className="form-label">
                  Verification Code
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="form-input code-input"
                  placeholder="Enter 6-digit code from email"
                  maxLength="6"
                  required
                  disabled={loading || sendingCode}
                />
              </div>
              <button
                type="submit"
                className="confirm-btn"
                disabled={loading || sendingCode || !code || code.length !== 6}
              >
                {loading ? "Verifying..." : "Confirm"}
              </button>
            </form>
          </div>

          {error && <div className="error-message">{error}</div>}
          {successMessage && <div className="success-message">{successMessage}</div>}
        </div>
      </div>
    </div>
  );
}

