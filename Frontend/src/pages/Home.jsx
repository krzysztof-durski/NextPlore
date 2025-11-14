import React, { useState, useEffect } from 'react'
import MapComponent from '../components/Map'
import SearchBar from '../components/SearchBar'
import '../styles/Home.css'

export default function Home() {
  const [locations, setLocations] = useState([])
  const [userLocation, setUserLocation] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Get user's current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => console.error('Error getting location:', error)
      )
    }
  }, [])

  return (
    <div className="home">
      <header className="header">
        <h1>NextPlore</h1>
        <SearchBar onSearch={setLocations} />
      </header>
      <main className="main-content">
        {userLocation && (
          <MapComponent locations={locations} userLocation={userLocation} />
        )}
      </main>
    </div>
  )
}
