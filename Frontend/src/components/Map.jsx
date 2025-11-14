import React from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import '../styles/Map.css'

export default function MapComponent({ locations, userLocation }) {
  const createCustomIcon = (iconPrefix, iconSuffix) => {
    if (!iconPrefix || !iconSuffix) {
      // Default icon if no custom icon
      return L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })
    }

    return L.icon({
      iconUrl: `${iconPrefix}bg_64${iconSuffix}`,
      iconSize: [64, 64],
      iconAnchor: [32, 64],
      popupAnchor: [0, -64]
    })
  }

  return (
    <MapContainer 
      center={[userLocation.latitude, userLocation.longitude]} 
      zoom={13} 
      className="map-container"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      {/* User location marker */}
      <Marker position={[userLocation.latitude, userLocation.longitude]}>
        <Popup>Your Location</Popup>
      </Marker>

      {/* Location markers */}
      {locations.map((location) => (
        <Marker
          key={location.location_id}
          position={[location.location.coordinates[1], location.location.coordinates[0]]}
          icon={createCustomIcon(location.icon_prefix, location.icon_suffix)}
        >
          <Popup>
            <div>
              <h3>{location.name}</h3>
              <p>{location.address}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
