import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "../styles/Map.css";

// Component to handle map interactions
function MapController({ selectedLocation }) {
  const map = useMap();

  useEffect(() => {
    if (selectedLocation && selectedLocation.location?.coordinates) {
      const [lon, lat] = selectedLocation.location.coordinates;
      map.flyTo([lat, lon], 15, {
        duration: 1.5,
      });
    }
  }, [selectedLocation, map]);

  return null;
}

export default function MapComponent({
  locations,
  userLocation,
  selectedLocation,
  onLocationSelect,
}) {
  const createCustomIcon = (iconPrefix, iconSuffix, isSelected = false) => {
    if (!iconPrefix || !iconSuffix) {
      // Default icon if no custom icon
      return L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
        iconSize: isSelected ? [35, 57] : [25, 41],
        iconAnchor: isSelected ? [17.5, 57] : [12, 41],
        popupAnchor: [1, -34],
        shadowSize: isSelected ? [57, 57] : [41, 41],
      });
    }

    return L.icon({
      iconUrl: `${iconPrefix}bg_64${iconSuffix}`,
      iconSize: isSelected ? [80, 80] : [50, 50],
      iconAnchor: isSelected ? [40, 80] : [25, 50],
      popupAnchor: [0, isSelected ? -80 : -50],
    });
  };

  const createUserIcon = () => {
    return L.divIcon({
      className: "user-location-marker",
      html: '<div class="user-marker-inner"></div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  return (
    <MapContainer
      center={[userLocation.latitude, userLocation.longitude]}
      zoom={13}
      className="map-container"
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <MapController selectedLocation={selectedLocation} />

      {/* User location marker */}
      <Marker
        position={[userLocation.latitude, userLocation.longitude]}
        icon={createUserIcon()}
      >
        <Popup>
          <div className="popup-content">
            <strong>Your Location</strong>
          </div>
        </Popup>
      </Marker>

      {/* Location markers */}
      {Array.isArray(locations) && locations.map((location) => {
        if (!location.location?.coordinates) return null;

        const [lon, lat] = location.location.coordinates;
        const isSelected =
          selectedLocation?.location_id === location.location_id;

        // Get icon from first tag if available
        const firstTag = location.tags && location.tags.length > 0 ? location.tags[0] : null;
        const iconPrefix = firstTag?.icon_prefix || null;
        const iconSuffix = firstTag?.icon_suffix || null;

        return (
          <Marker
            key={location.location_id}
            position={[lat, lon]}
            icon={createCustomIcon(
              iconPrefix,
              iconSuffix,
              isSelected
            )}
            eventHandlers={{
              click: () => onLocationSelect(location),
            }}
          >
            <Popup>
              <div className="popup-content">
                <h3>{location.name}</h3>
                <p>{location.address}</p>
                {location.description && (
                  <p className="description">{location.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
