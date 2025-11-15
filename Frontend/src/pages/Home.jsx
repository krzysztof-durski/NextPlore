import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import MapComponent from "../components/Map";
import { getNearbyLocations } from "../services/locationService";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [locations, setLocations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    // Check if we have filtered locations from navigation state
    if (location.state?.filteredLocations) {
      // Ensure filteredLocations is an array
      const filtered = Array.isArray(location.state.filteredLocations)
        ? location.state.filteredLocations
        : [];
      setLocations(filtered);
      setLoading(false);
      // Clear the state to prevent reusing on refresh
      window.history.replaceState({}, document.title);
      return;
    }

    // Get user's current location
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(userLoc);
          // Fetch nearby locations automatically
          fetchNearbyLocations(userLoc.latitude, userLoc.longitude);
        },
        (error) => {
          console.error("Error getting location:", error);
          setError(
            "Unable to get your location. Please enable location services."
          );
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const fetchNearbyLocations = async (lat, lon, radius = 2) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNearbyLocations(lat, lon, radius);
      // Log the data to debug
      console.log(
        "Fetched locations data:",
        data,
        "Type:",
        typeof data,
        "IsArray:",
        Array.isArray(data)
      );
      // Ensure data is an array before setting it
      const locationsArray = Array.isArray(data) ? data : [];
      setLocations(locationsArray);
    } catch (err) {
      console.error("Error fetching nearby locations:", err);
      setError(err.message || "Failed to fetch nearby locations");
      // Set empty array on error to prevent map errors
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  const handleLocationClick = (location) => {
    setSelectedLocation(location);
  };

  const handleLocationCardClick = (locationId) => {
    navigate(`/location/${locationId}`);
  };

  const handleFilterClick = () => {
    if (!userLocation) {
      alert("Please wait for your location to be detected");
      return;
    }
    // Navigate to filter page with user location
    navigate("/filter", {
      state: {
        userLocation: userLocation,
      },
    });
  };

  return (
    <div className="home">
      {/* Header */}
      <header className="header">
        <h1 className="logo">NEXTPLORE</h1>
        <nav className="nav-buttons">
          <button className="nav-btn active">HOME</button>
          <button className="nav-btn" onClick={handleLogout}>
            LOGOUT
          </button>
          <button className="nav-btn" onClick={() => navigate("/account")}>
            MY ACCOUNT
          </button>
        </nav>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Sidebar with location cards */}
        <aside className="sidebar">
          {loading && (
            <div className="loading-message">Loading nearby locations...</div>
          )}

          {error && <div className="error-message">{error}</div>}

          {!loading &&
            Array.isArray(locations) &&
            locations.length === 0 &&
            !error && (
              <div className="empty-message">No nearby locations found</div>
            )}

          {Array.isArray(locations) &&
            locations.map((location) => (
              <div
                key={location.location_id}
                className={`location-card ${
                  selectedLocation?.location_id === location.location_id
                    ? "selected"
                    : ""
                }`}
                onClick={() => handleLocationCardClick(location.location_id)}
              >
                <h3 className="location-name">{location.name || "place"}</h3>
                <div className="location-info">
                  <p className="info-item">{location.address || "INFO 1"}</p>
                  <p className="info-item">
                    {location.description || "INFO 1"}
                  </p>
                  <p className="info-item">
                    {location.location?.coordinates
                      ? `${location.location.coordinates[1].toFixed(
                          4
                        )}, ${location.location.coordinates[0].toFixed(4)}`
                      : "INFO 1"}
                  </p>
                </div>
              </div>
            ))}
        </aside>

        {/* Map */}
        <div className="map-section">
          {userLocation ? (
            <MapComponent
              locations={locations}
              userLocation={userLocation}
              selectedLocation={selectedLocation}
              onLocationSelect={handleLocationClick}
            />
          ) : (
            <div className="map-placeholder">
              <p>Loading map...</p>
            </div>
          )}

          {/* Filter button */}
          <button className="filter-btn" onClick={handleFilterClick}>
            FILTER LOCATIONS
            <span className="arrow">→</span>
          </button>
        </div>
      </main>
    </div>
  );
}
