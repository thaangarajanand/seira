import React from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

const LocationPicker = ({ position, onPositionChange }) => {
  function MapEvents() {
    useMapEvents({
      click(e) {
        onPositionChange([e.latlng.lat, e.latlng.lng]);
      },
    });
    return null;
  }

  const center = position || [20.5937, 78.9629];

  return (
    <div className="profile-map-container" style={{ height: '300px', width: '100%', borderRadius: '12px', border: '1px solid var(--slate-200)', overflow: 'hidden' }}>
      <MapContainer center={center} zoom={position ? 13 : 5} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {position && <Marker position={position} />}
        <MapEvents />
      </MapContainer>
    </div>
  );
};

export default LocationPicker;
