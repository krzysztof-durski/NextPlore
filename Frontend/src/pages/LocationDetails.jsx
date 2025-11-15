import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getPlaceDetails } from "../services/locationService";
import "../styles/LocationDetails.css";

export default function LocationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getPlaceDetails(id);
        setLocation(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handleGetDirections = () => {
    if (location?.location?.coordinates) {
      const [lon, lat] = location.location.coordinates;
      // Open Google Maps with directions
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
        "_blank"
      );
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="location-details-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading location details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="location-details-page">
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleBack} className="back-btn-error">
            GO BACK
          </button>
        </div>
      </div>
    );
  }

  if (!location) {
    return (
      <div className="location-details-page">
        <div className="error-container">
          <h2>Location not found</h2>
          <button onClick={handleBack} className="back-btn-error">
            GO BACK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="location-details-page">
      {/* Header with navigation */}
      <header className="details-header">
        <h1 className="logo">NEXTPLORE</h1>
        <nav className="nav-buttons">
          <button className="nav-btn" onClick={handleBack}>
            home
          </button>
          <button className="nav-btn">profile</button>
          <button className="nav-btn" onClick={handleLogout}>logout</button>
        </nav>
      </header>

      <div className="details-content">
        {/* Back Button */}
        <button className="back-btn" onClick={handleBack}>
          <span className="arrow-left">←</span>
          BACK
        </button>

        {/* Main Content Grid */}
        <div className="details-grid">
          {/* Left: Image/Map Placeholder */}
          <div className="image-container">
            {location.icon_prefix && location.icon_suffix ? (
              <img
                src={`${location.icon_prefix}bg_512${location.icon_suffix}`}
                alt={location.name}
                className="location-icon"
              />
            ) : (
              <div className="placeholder-image">
                <span className="placeholder-text">📍</span>
              </div>
            )}
          </div>

          {/* Right: Info Container */}
          <div className="info-container">
            {/* Description Box */}
            <div className="description-box">
              <h2 className="location-name">{location.name}</h2>
              <p className="location-address">{location.address}</p>
              {location.description && (
                <p className="location-description">{location.description}</p>
              )}
            </div>

            {/* Tags Section */}
            {location.tags && location.tags.length > 0 && (
              <div className="tags-section">
                <div className="tags-grid">
                  {location.tags.map((tag, index) => (
                    <div
                      key={tag.tag_id || index}
                      className="tag-pill"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      {tag.tag_name || tag.name || tag}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Get Directions Button */}
        <button className="directions-btn" onClick={handleGetDirections}>
          GET DIRECTIONS
          <span className="arrow-right">→</span>
        </button>
      </div>
    </div>
  );
}
