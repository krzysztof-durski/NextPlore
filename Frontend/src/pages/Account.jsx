import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  getCurrentUser,
  changeUsername,
  changeFullname,
  changePassword,
  changeCountry,
  deleteAccount,
  logout,
} from "../services/authService";
import "../styles/Account.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Account() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeModal, setActiveModal] = useState(null); // 'username', 'fullname', 'password', 'country', 'delete'
  const [codeSent, setCodeSent] = useState(false); // Track if deletion code has been sent
  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    new_username: "",
    fullname: "",
    old_password: "",
    new_password: "",
    repeat_new_password: "",
    country_id: "",
    password: "", // for username/fullname changes
    delete_password: "", // for account deletion
    delete_code: "", // for account deletion verification
  });

  useEffect(() => {
    fetchUserData();
    fetchCountries();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
      setFormData((prev) => ({
        ...prev,
        country_id: userData.country_id,
      }));
    } catch (err) {
      setError(err.message || "Failed to load user data");
    } finally {
      setLoading(false);
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/countries/`);
      const countriesData = response.data?.data || response.data || [];
      setCountries(countriesData);
    } catch (err) {
      console.error("Failed to fetch countries:", err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    setSuccess("");
  };

  // Filter countries based on search input
  const filteredCountries = countrySearch.trim()
    ? countries.filter((country) =>
        country.country_name
          .toLowerCase()
          .includes(countrySearch.toLowerCase())
      )
    : countries;

  // Handle country selection
  const handleCountrySelect = (countryId, countryName) => {
    setFormData((prev) => ({
      ...prev,
      country_id: countryId,
    }));
    setCountrySearch(
      countries.find((c) => c.country_id === countryId)?.flag
        ? `${countries.find((c) => c.country_id === countryId).flag} ${countryName}`
        : countryName
    );
    setIsCountryDropdownOpen(false);
  };

  // Handle country search input change
  const handleCountrySearchChange = (e) => {
    setCountrySearch(e.target.value);
    setIsCountryDropdownOpen(true);
    // If country is already selected and user starts typing, clear selection
    if (formData.country_id) {
      setFormData((prev) => ({
        ...prev,
        country_id: "",
      }));
    }
  };

  const handleChangeUsername = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.new_username || !formData.password) {
      setError("Username and password are required");
      return;
    }

    try {
      const updatedUser = await changeUsername(
        formData.new_username,
        formData.password
      );
      setUser(updatedUser);
      setSuccess("Username changed successfully");
      setFormData((prev) => ({ ...prev, new_username: "", password: "" }));
      setTimeout(() => {
        setActiveModal(null);
        setSuccess("");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to change username");
    }
  };

  const handleChangeFullname = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.fullname || !formData.password) {
      setError("Fullname and password are required");
      return;
    }

    try {
      const updatedUser = await changeFullname(
        formData.fullname,
        formData.password
      );
      setUser(updatedUser);
      setSuccess("Fullname changed successfully");
      setFormData((prev) => ({ ...prev, fullname: "", password: "" }));
      setTimeout(() => {
        setActiveModal(null);
        setSuccess("");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to change fullname");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.old_password ||
      !formData.new_password ||
      !formData.repeat_new_password
    ) {
      setError("All password fields are required");
      return;
    }

    if (formData.new_password !== formData.repeat_new_password) {
      setError("New passwords do not match");
      return;
    }

    try {
      await changePassword(
        formData.old_password,
        formData.new_password,
        formData.repeat_new_password
      );
      setSuccess("Password changed successfully");
      setFormData((prev) => ({
        ...prev,
        old_password: "",
        new_password: "",
        repeat_new_password: "",
      }));
      setTimeout(() => {
        setActiveModal(null);
        setSuccess("");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to change password");
    }
  };

  const handleChangeCountry = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.country_id) {
      setError("Please select a country");
      return;
    }

    // Validate that a country was actually selected
    const selectedCountry = countries.find(
      (c) => c.country_id === parseInt(formData.country_id)
    );
    if (!selectedCountry) {
      setError("Please select a valid country");
      return;
    }

    try {
      const updatedUser = await changeCountry(formData.country_id);
      setUser(updatedUser);
      setSuccess("Country changed successfully");
      setTimeout(() => {
        setActiveModal(null);
        setSuccess("");
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to change country");
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.delete_code || !formData.delete_password) {
      setError("Verification code and password are required");
      return;
    }

    try {
      // First verify the code
      await deleteAccount.verifyCode(formData.delete_code);
      // Then confirm deletion with password
      await deleteAccount.confirm(formData.delete_password);
      setSuccess("Account deleted successfully");
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to delete account");
    }
  };

  const handleRequestDeleteCode = async () => {
    setError("");
    setSuccess("");
    try {
      await deleteAccount.sendCode();
      setSuccess("Verification code sent to your email");
      setCodeSent(true);
    } catch (err) {
      setError(err.message || "Failed to send verification code");
      setCodeSent(false);
    }
  };

  const openModal = (modalType) => {
    setActiveModal(modalType);
    setError("");
    setSuccess("");
    // Pre-fill form data for certain modals
    if (modalType === "fullname" && user) {
      setFormData((prev) => ({ ...prev, fullname: user.fullname }));
    }
    if (modalType === "country" && user && countries.length > 0) {
      // Initialize country search with current country
      const currentCountry = countries.find(
        (c) => c.country_id === user.country_id
      );
      if (currentCountry) {
        setCountrySearch(
          currentCountry.flag
            ? `${currentCountry.flag} ${currentCountry.country_name}`
            : currentCountry.country_name
        );
      } else {
        setCountrySearch("");
      }
      setIsCountryDropdownOpen(false);
    } else if (modalType === "country") {
      setCountrySearch("");
      setIsCountryDropdownOpen(false);
    }
    if (modalType === "delete") {
      setCodeSent(false); // Reset code sent state when opening delete modal
    }
  };

  const closeModal = () => {
    setActiveModal(null);
    setError("");
    setSuccess("");
    setCodeSent(false);
    setCountrySearch("");
    setIsCountryDropdownOpen(false);
    setFormData({
      new_username: "",
      fullname: user?.fullname || "",
      old_password: "",
      new_password: "",
      repeat_new_password: "",
      country_id: user?.country_id || "",
      password: "",
      delete_password: "",
      delete_code: "",
    });
  };

  if (loading) {
    return (
      <div className="account-page">
        <div className="loading-message">Loading account information...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="account-page">
        <div className="error-message">Failed to load user data</div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="account-page">
      {/* Header */}
      <header className="account-header">
        <h1 className="account-logo">NEXTPLORE</h1>
        <nav className="account-nav-buttons">
          <button
            className="account-nav-btn"
            onClick={() => navigate("/")}
          >
            HOME
          </button>
          <button className="account-nav-btn" onClick={handleLogout}>
            LOGOUT
          </button>
          <button className="account-nav-btn active">MY ACCOUNT</button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="account-main">
        <h2 className="account-title">{user.username} Account</h2>

        <div className="account-content">
          {/* Left Section - Profile */}
          <div className="profile-section">
            <h3 className="profile-title">Your profile</h3>
            <div className="profile-details">
              <div className="profile-item">
                <span className="profile-label">Name:</span>
                <span className="profile-value">{user.fullname}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Username:</span>
                <span className="profile-value">{user.username}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Email:</span>
                <span className="profile-value">{user.email}</span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Date of birth:</span>
                <span className="profile-value">
                  {formatDate(user.date_of_birth)}
                </span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Adult:</span>
                <span className="profile-value">
                  {user.is_adult ? "YES" : "NO"}
                </span>
              </div>
              <div className="profile-item">
                <span className="profile-label">Country:</span>
                <span className="profile-value">
                  {user.country_name || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Right Section - Action Buttons */}
          <div className="actions-section">
            <button
              className="action-btn"
              onClick={() => openModal("username")}
            >
              CHANGE USERNAME
            </button>
            <button
              className="action-btn"
              onClick={() => openModal("fullname")}
            >
              CHANGE FULLNAME
            </button>
            <button
              className="action-btn"
              onClick={() => openModal("password")}
            >
              CHANGE PASSWORD
            </button>
            <button
              className="action-btn"
              onClick={() => openModal("country")}
            >
              CHANGE COUNTRY
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => openModal("delete")}
            >
              DELETE ACCOUNT
            </button>
          </div>
        </div>
      </main>

      {/* Modals */}
      {activeModal === "username" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Change Username</h3>
            <form onSubmit={handleChangeUsername}>
              <div className="form-group">
                <label htmlFor="new_username">New Username</label>
                <input
                  type="text"
                  id="new_username"
                  name="new_username"
                  value={formData.new_username}
                  onChange={handleInputChange}
                  required
                  maxLength={32}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <div className="modal-buttons">
                <button type="submit" className="modal-submit-btn">
                  CHANGE
                </button>
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={closeModal}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "fullname" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Change Fullname</h3>
            <form onSubmit={handleChangeFullname}>
              <div className="form-group">
                <label htmlFor="fullname">New Fullname</label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleInputChange}
                  required
                  maxLength={255}
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <div className="modal-buttons">
                <button type="submit" className="modal-submit-btn">
                  CHANGE
                </button>
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={closeModal}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "password" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Change Password</h3>
            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label htmlFor="old_password">Old Password</label>
                <input
                  type="password"
                  id="old_password"
                  name="old_password"
                  value={formData.old_password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="new_password">New Password</label>
                <input
                  type="password"
                  id="new_password"
                  name="new_password"
                  value={formData.new_password}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                />
              </div>
              <div className="form-group">
                <label htmlFor="repeat_new_password">Repeat New Password</label>
                <input
                  type="password"
                  id="repeat_new_password"
                  name="repeat_new_password"
                  value={formData.repeat_new_password}
                  onChange={handleInputChange}
                  required
                  minLength={8}
                />
              </div>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <div className="modal-buttons">
                <button type="submit" className="modal-submit-btn">
                  CHANGE
                </button>
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={closeModal}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "country" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Change Country</h3>
            <form onSubmit={handleChangeCountry}>
              <div className="form-group">
                <label htmlFor="country_id">Select Country</label>
                <div className="country-dropdown-container">
                  <input
                    type="text"
                    id="country_id"
                    name="country_id"
                    value={countrySearch}
                    onChange={handleCountrySearchChange}
                    onFocus={() => setIsCountryDropdownOpen(true)}
                    onBlur={() => {
                      // Delay closing to allow click on dropdown items
                      setTimeout(() => setIsCountryDropdownOpen(false), 200);
                    }}
                    placeholder="Type to search countries..."
                    className="country-search-input"
                    required
                    autoComplete="off"
                  />
                  {isCountryDropdownOpen && (
                    <div
                      className="country-dropdown-list"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <div
                            key={country.country_id}
                            className={`country-dropdown-item ${
                              formData.country_id === country.country_id.toString()
                                ? "selected"
                                : ""
                            }`}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleCountrySelect(
                                country.country_id,
                                country.country_name
                              );
                            }}
                          >
                            {country.flag
                              ? `${country.flag} ${country.country_name}`
                              : country.country_name}
                          </div>
                        ))
                      ) : (
                        <div className="country-dropdown-item no-results">
                          No countries found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              <div className="modal-buttons">
                <button type="submit" className="modal-submit-btn">
                  CHANGE
                </button>
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={closeModal}
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "delete" && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Delete Account</h3>
            <p className="delete-warning">
              This action cannot be undone. Please click the button below to send a verification code
              to your email, then enter the code and your password to confirm.
            </p>
            {!codeSent && (
              <div className="form-group">
                <button
                  type="button"
                  className="modal-submit-btn"
                  onClick={handleRequestDeleteCode}
                  style={{ width: "100%", marginBottom: "20px" }}
                >
                  SEND VERIFICATION CODE
                </button>
              </div>
            )}
            {codeSent && (
              <form onSubmit={handleDeleteAccount}>
                <div className="form-group">
                  <label htmlFor="delete_code">Verification Code</label>
                  <input
                    type="text"
                    id="delete_code"
                    name="delete_code"
                    value={formData.delete_code}
                    onChange={handleInputChange}
                    required
                    maxLength={6}
                    placeholder="6-digit code"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="delete_password">Password</label>
                  <input
                    type="password"
                    id="delete_password"
                    name="delete_password"
                    value={formData.delete_password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                <div className="modal-buttons">
                  <button type="submit" className="modal-submit-btn delete-submit-btn">
                    DELETE ACCOUNT
                  </button>
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={closeModal}
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            )}
            {error && !codeSent && <div className="error-message">{error}</div>}
            {success && !codeSent && <div className="success-message">{success}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

