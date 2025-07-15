import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DEFAULT_POSITION = [14.5995, 120.9842]; // Manila

function LocationMarker({ position, setPosition, setSelectedAddress, onSelect }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      const address = `Lat: ${e.latlng.lat}, Lng: ${e.latlng.lng}`;
      setSelectedAddress(address);
      onSelect({ address });
    }
  });

  return position ? <Marker position={position} /> : null;
}

const MapPicker = ({ onSelect, initialLocation }) => {
  const [position, setPosition] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');

  useEffect(() => {
    if (initialLocation && typeof initialLocation === 'string') {
      setSelectedAddress(initialLocation);
      setPosition(null);
    } else {
      setSelectedAddress('');
      setPosition(null);
    }
  }, [initialLocation]);

  return (
    <div style={{ height: 300, width: '100%', borderRadius: 8, overflow: 'hidden', marginBottom: 8 }}>
      <MapContainer
        center={position || DEFAULT_POSITION}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          position={position}
          setPosition={setPosition}
          setSelectedAddress={setSelectedAddress}
          onSelect={onSelect}
        />
      </MapContainer>
      <div className="text-xs text-gray-500 mt-1">Click on the map to select your shipping location.</div>
      {selectedAddress && (
        <div className="mt-2 text-xs text-gray-600">
          Selected: {selectedAddress}
        </div>
      )}
    </div>
  );
};

export default MapPicker;
