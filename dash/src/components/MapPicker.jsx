import { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_POSITION = [14.5995, 120.9842]; // Manila

function LocationMarker({ onSelect }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      // Optionally, use a geocoding API to get address from lat/lng
      onSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        address: `Lat: ${e.latlng.lat}, Lng: ${e.latlng.lng}`
      });
    }
  });

  return position ? <Marker position={position} /> : null;
}

const MapPicker = ({ onSelect }) => (
  <div style={{ height: 300, width: '100%', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
    <MapContainer center={DEFAULT_POSITION} zoom={13} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker onSelect={onSelect} />
    </MapContainer>
    <div className="text-xs text-gray-500 mt-1">Click on the map to select your shipping location.</div>
  </div>
);

export default MapPicker;
