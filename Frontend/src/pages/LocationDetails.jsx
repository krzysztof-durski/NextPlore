import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getPlaceDetails } from '../services/locationService'
import '../styles/LocationDetails.css'

export default function LocationDetails() {
  const { id } = useParams()
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getPlaceDetails(id)
        setLocation(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [id])

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!location) return <div>Location not found</div>

  return (
    <div className="location-details">
      <h1>{location.name}</h1>
      <p>{location.address}</p>
      <p>{location.description}</p>
      {location.tags && (
        <div className="tags">
          {location.tags.map((tag) => (
            <span key={tag.tag_id} className="tag">{tag.name}</span>
          ))}
        </div>
      )}
    </div>
  )
}
