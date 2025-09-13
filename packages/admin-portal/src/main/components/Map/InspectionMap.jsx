// src/main/components/Map/InspectionMap.jsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Geocode function
const geocode = async (city) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}`
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (err) {
    console.error(`Geocoding failed for ${city}:`, err);
  }
  return null;
};

const InspectionMap = ({ sites }) => {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    const fetchCoords = async () => {
      const results = [];
      for (const site of sites) {
        if (site.location) {
          const coords = await geocode(site.location);
          if (coords) results.push({ ...site, ...coords });
        }
      }
      setMarkers(results);
    };

    if (sites && sites.length > 0) fetchCoords();
  }, [sites]);

  return (
    <div className="inspection-map" style={{ height: '500px', width: '100%' }}>
      <h2>Inspection Map</h2>
      <MapContainer center={[-1.286389, 36.817223]} zoom={6} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        {markers.map((site) => (
          <Marker key={site.id} position={[site.lat, site.lng]}>
            <Popup>
              <strong>{site.name}</strong>
              <br />
              Location: {site.location || '—'}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default InspectionMap;