import React from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const TrackingMap = ({ origin, destination, current, status }) => {
  const originPos = origin ? [origin.lat, origin.lng] : null;
  const destPos = destination ? [destination.lat, destination.lng] : null;
  const currentPos = current ? [current.lat, current.lng] : (originPos || [20.5937, 78.9629]);
  
  const center = currentPos;
  
  return (
    <div className="tracking-map" style={{ height: '300px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--slate-200)', position: 'relative', boxShadow: 'var(--shadow-sm)' }}>
      <MapContainer center={center} zoom={status === 'out_for_delivery' ? 15 : 12} zoomControl={true} scrollWheelZoom={false}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {originPos && (
          <Marker position={originPos}>
            <Tooltip permanent direction="top">🏭 Manufacturer</Tooltip>
          </Marker>
        )}
        
        {destPos && (
          <Marker position={destPos}>
            <Tooltip permanent direction="top">🏠 Delivery Location</Tooltip>
          </Marker>
        )}

        {currentPos && status !== 'completed' && status !== 'accepted' && (
          <Marker position={currentPos} icon={L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color:var(--teal-600); width:20px; height:20px; border-radius:50%; border:3px solid #fff; box-shadow:0 0 10px rgba(0,0,0,0.3); position:relative;"><div class="map-marker-pulse" style="position:absolute; inset:-10px; border-radius:50%; background:rgba(13,148,136,0.3);"></div></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          })}>
            <Tooltip permanent direction="bottom">🚚 {status === 'out_for_delivery' ? 'Package is Nearby' : 'In Transit'}</Tooltip>
          </Marker>
        )}

        {originPos && destPos && (
          <Polyline 
            positions={[originPos, destPos]} 
            color="#0D9488" 
            dashArray="10, 10" 
            weight={3} 
            opacity={0.6}
          />
        )}
      </MapContainer>
      <div style={{ zIndex: 1000, position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.95)', padding: '6px 12px', borderRadius: '8px', fontSize: '.75rem', fontWeight: 700, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--slate-200)', color: 'var(--teal-700)' }}>
        {status === 'out_for_delivery' ? '⚡ Priority Delivery' : status === 'shipped' ? '🚚 On the Way' : '📍 Shipping Route'}
      </div>
    </div>
  );
};

export default TrackingMap;
