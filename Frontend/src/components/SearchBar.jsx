import React, { useState } from 'react'
import { getNearbyLocations } from '../services/locationService'
import '../styles/SearchBar.css'

export default function SearchBar({ onSearch }) {
  const [radius, setRadius] = useState(2)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSearch = async () => {
    setLoading(true)
    setError(null)

    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
          const locations = await getNearbyLocations(
            position.coords.latitude,
            position.coords.longitude,
            radius
          )
          onSearch(locations)
          setLoading(false)
        })
      }
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="search-bar">
      <label>
        Radius (km):
        <input
          type="number"
          min="1"
          max="50"
          value={radius}
          onChange={(e) => setRadius(parseFloat(e.target.value))}
        />
      </label>
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Find Nearby Locations'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  )
}
