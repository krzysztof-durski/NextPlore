import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../services/authService";
import axios from "axios";
import "../styles/Register.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullname: "",
    username: "",
    email: "",
    date_of_birth: "",
    country: "",
    password: "",
    repeat_password: "",
  });
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [countrySearch, setCountrySearch] = useState("");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  useEffect(() => {
    // Fetch countries for dropdown
    const fetchCountries = async () => {
      try {
        console.log("Fetching countries from:", `${API_BASE_URL}/countries/`);
        const response = await axios.get(`${API_BASE_URL}/countries/`);
        console.log("Countries response:", response.data);
        const countriesData = response.data?.data || response.data || [];
        console.log("Countries data:", countriesData);
        setCountries(countriesData);
        if (countriesData.length === 0) {
          console.warn("No countries found in response");
        }
      } catch (err) {
        console.error("Failed to fetch countries:", err);
        console.error("Error details:", err.response?.data || err.message);
        setError(
          `Failed to load countries: ${
            err.response?.data?.message || err.message
          }. Please refresh the page.`
        );
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) setError("");
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
      country: countryId,
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
    if (formData.country) {
      setFormData((prev) => ({
        ...prev,
        country: "",
      }));
    }
  };

  // Get selected country display text
  const getSelectedCountryText = () => {
    if (!formData.country) return "";
    const selectedCountry = countries.find(
      (c) => c.country_id === parseInt(formData.country)
    );
    if (!selectedCountry) return "";
    return selectedCountry.flag
      ? `${selectedCountry.flag} ${selectedCountry.country_name}`
      : selectedCountry.country_name;
  };

  // Initialize country search when country is selected from outside
  useEffect(() => {
    if (formData.country && !countrySearch && countries.length > 0) {
      const selectedCountry = countries.find(
        (c) => c.country_id === parseInt(formData.country)
      );
      if (selectedCountry) {
        setCountrySearch(
          selectedCountry.flag
            ? `${selectedCountry.flag} ${selectedCountry.country_name}`
            : selectedCountry.country_name
        );
      }
    }
  }, [formData.country, countries]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate country is selected
    if (!formData.country) {
      setError("Please select a country");
      setLoading(false);
      return;
    }

    try {
      await register(formData);
      // Store email in localStorage for verification route protection
      localStorage.setItem("pendingVerificationEmail", formData.email);
      // Navigate to verify email page after successful registration
      navigate("/verify-email", {
        state: {
          email: formData.email,
        },
      });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Logo */}
        <div className="logo-container">
          <h1 className="logo-text">NEXTPLORE</h1>
        </div>

        {/* Registration Form */}
        <form className="register-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Left Column */}
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="fullname" className="form-label">
                  full name
                </label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="username" className="form-label">
                  username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                  disabled={loading}
                />
                <span className="field-note">(can't be changed later)</span>
              </div>
            </div>

            {/* Right Column */}
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="date_of_birth" className="form-label">
                  date of birth
                </label>
                <input
                  type="date"
                  id="date_of_birth"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  className="form-input"
                  required
                  disabled={loading}
                />
                <span className="field-note">(can't be changed later)</span>
              </div>

              <div className="form-group">
                <label htmlFor="country" className="form-label">
                  country
                </label>
                <div className="country-dropdown-container">
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={countrySearch}
                    onChange={handleCountrySearchChange}
                    onFocus={() => setIsCountryDropdownOpen(true)}
                    onBlur={() => {
                      // Delay closing to allow click on dropdown items
                      setTimeout(() => setIsCountryDropdownOpen(false), 200);
                    }}
                    placeholder="Type to search countries..."
                    className="form-select country-search-input"
                    required
                    disabled={loading || loadingCountries}
                    autoComplete="off"
                  />
                  {isCountryDropdownOpen && !loadingCountries && (
                    <div
                      className="country-dropdown-list"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {filteredCountries.length > 0 ? (
                        filteredCountries.map((country) => (
                          <div
                            key={country.country_id}
                            className={`country-dropdown-item ${
                              formData.country === country.country_id.toString()
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

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="repeat_password" className="form-label">
                  repeat password
                </label>
                <input
                  type="password"
                  id="repeat_password"
                  name="repeat_password"
                  value={formData.repeat_password}
                  onChange={handleChange}
                  className="form-input"
                  required
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="register-submit-btn"
            disabled={loading}
          >
            {loading ? "REGISTERING..." : "REGISTER"}
          </button>

          <div className="login-link-container">
            <span className="login-link-text">Already have an account?</span>
            <Link to="/login" className="login-link">
              login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
