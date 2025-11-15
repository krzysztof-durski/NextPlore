import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getRecommendedLocations } from "../services/locationService";
import "../styles/FilterPage.css";

export default function FilterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const userLocation = location.state?.userLocation;

  const [selectedTags, setSelectedTags] = useState([]);
  const [distance, setDistance] = useState(5); // Default 5km
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);

  useEffect(() => {
    // TODO: Fetch tags from backend
    // For now using placeholder tags
    const placeholderTags = [
      "Restaurant",
      "Museum",
      "Park",
      "Cafe",
      "Theater",
      "Gallery",
      "Cinema",
      "Bar",
      "Library",
      "Stadium",
      "Beach",
      "Mountain",
      "Shopping",
      "Nightlife",
      "History",
      "Art",
      "Music",
      "Sports",
      "Nature",
      "Adventure",
      "Relaxing",
      "Romantic",
      "Family",
      "Cultural",
      "Modern",
      "Traditional",
      "Outdoor",
      "Indoor",
      "Active",
      "Peaceful",
      "Exciting",
      "Scenic",
    ];
    setAvailableTags(placeholderTags);
  }, []);

  const handleTagClick = (tag) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleFilter = async () => {
    if (selectedTags.length === 0) {
      alert("Please select at least one tag");
      return;
    }

    if (!userLocation) {
      alert("User location is required");
      navigate("/");
      return;
    }

    try {
      setLoading(true);
      const data = await getRecommendedLocations(
        selectedTags,
        userLocation,
        distance
      );

      // Navigate back to home with filtered results
      navigate("/", {
        state: {
          filteredLocations: data,
          filterApplied: true,
        },
      });
    } catch (error) {
      alert(error.message || "Failed to fetch recommendations");
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  if (!userLocation) {
    return (
      <div className="filter-page">
        <div className="error-container">
          <h2>Error: No location data</h2>
          <p>Please return to the home page</p>
          <button onClick={handleBack} className="back-btn">
            GO BACK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="filter-page">
      <div className="filter-container">
        {/* Back Button */}
        <button className="back-btn" onClick={handleBack}>
          <span className="arrow-left">←</span>
          BACK
        </button>

        {/* Header Section with Distance Slider */}
        <div className="filter-header">
          <h1 className="filter-title">What are you looking for?</h1>

          {/* Distance Slider Section - Top Right */}
          <div className="distance-slider-section">
            <div className="distance-display">
              <span className="distance-value">{distance}</span>
              <span className="distance-unit">km</span>
            </div>
            <div className="slider-container">
              <input
                type="range"
                min="1"
                max="10"
                value={distance}
                onChange={(e) => setDistance(parseInt(e.target.value))}
                className="distance-range"
              />
              <div
                className="slider-track-fill"
                style={{ width: `${(distance / 10) * 100}%` }}
              ></div>
            </div>
            <div className="distance-labels">
              <span>1 km</span>
              <span>10 km</span>
            </div>
          </div>
        </div>

        {/* Tags Grid */}
        <div className="tags-section">
          <div className="tags-grid">
            {availableTags.map((tag, index) => (
              <button
                key={index}
                className={`tag-btn ${
                  selectedTags.includes(tag) ? "selected" : ""
                }`}
                onClick={() => handleTagClick(tag)}
                style={{ animationDelay: `${index * 0.02}s` }}
              >
                <span className="tag-text">{tag}</span>
                <span className="tag-checkmark">✓</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Button */}
        <button
          className={`filter-submit-btn ${loading ? "loading" : ""}`}
          onClick={handleFilter}
          disabled={loading || selectedTags.length === 0}
        >
          {loading ? "FILTERING..." : "FILTER"}
          <span className="arrow">→</span>
        </button>
      </div>
    </div>
  );
}
