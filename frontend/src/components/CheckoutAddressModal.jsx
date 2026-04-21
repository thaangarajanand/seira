import React, { useState } from 'react';
import { X, MapPin, Navigation, Phone, User, Home, Building, Hash, Save, Loader2, CheckSquare, Square } from 'lucide-react';
import LocationPicker from './LocationPicker';

export default function CheckoutAddressModal({ user, initialAddress, onSave, onClose }) {
  const [form, setForm] = useState({
    name: initialAddress?.name || user?.name || '',
    phone: initialAddress?.phone || user?.phone || '',
    street: initialAddress?.street || user?.street || '',
    city: initialAddress?.city || user?.city || '',
    state: initialAddress?.state || user?.state || '',
    pincode: initialAddress?.pincode || user?.pincode || '',
    location: initialAddress?.location || user?.location || { lat: 20.5937, lng: 78.9629 }
  });

  const [loading, setLoading] = useState(false);
  const [saveToProfile, setSaveToProfile] = useState(true);

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation is not supported by your browser');
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({
          ...f,
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude }
        }));
        setLoading(false);
      },
      () => {
        alert('Could not get your location. Please select it on the map.');
        setLoading(false);
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.street || !form.city || !form.pincode) return alert('Please fill all mandatory fields');
    onSave(form, saveToProfile);
  };

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '40px', overflowY: 'auto' }}>
      <div className="modal" style={{ maxWidth: 700, width: '95%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, borderBottom: '1px solid var(--slate-100)', pb: 16 }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)' }}>Delivery Address</h2>
            <p style={{ fontSize: '.85rem', color: 'var(--slate-500)' }}>Where should we send your order?</p>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="form-group-v2">
            <label><User size={14} /> Contact Name</label>
            <input type="text" required value={form.name} onChange={update('name')} placeholder="Full Name" />
          </div>
          
          <div className="form-group-v2">
            <label><Phone size={14} /> Phone Number</label>
            <input type="text" required value={form.phone} onChange={update('phone')} placeholder="For delivery coordination" />
          </div>

          <div className="form-group-v2" style={{ gridColumn: 'span 2' }}>
            <label><Home size={14} /> Street Address / Landmark</label>
            <input type="text" required value={form.street} onChange={update('street')} placeholder="House No, Building, Street, Landmark" />
          </div>

          <div className="form-group-v2">
            <label><Building size={14} /> City</label>
            <input type="text" required value={form.city} onChange={update('city')} placeholder="City" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group-v2">
              <label>State</label>
              <input type="text" required value={form.state} onChange={update('state')} placeholder="State" />
            </div>
            <div className="form-group-v2">
              <label><Hash size={14} /> Pincode</label>
              <input type="text" required value={form.pincode} onChange={update('pincode')} placeholder="6-digit ZIP" />
            </div>
          </div>

          <div style={{ gridColumn: 'span 2', marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <label style={{ fontWeight: 700, fontSize: '.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <MapPin size={16} color="var(--teal-600)" /> Pin Drop Location
              </label>
              <button 
                type="button" 
                onClick={handleGetCurrentLocation} 
                className="btn-secondary" 
                style={{ fontSize: '.75rem', padding: '6px 12px' }}
                disabled={loading}
              >
                {loading ? <Loader2 size={14} className="spinner" /> : <Navigation size={14} />} 
                {loading ? ' Getting Location...' : ' Use My Location'}
              </button>
            </div>

            <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--slate-200)', background: 'var(--slate-50)', height: 250 }}>
               <LocationPicker 
                 position={[form.location.lat, form.location.lng]} 
                 onPositionChange={(pos) => setForm(f => ({ ...f, location: { lat: pos[0], lng: pos[1] } }))} 
               />
            </div>
            <p style={{ fontSize: '.7rem', color: 'var(--slate-400)', marginTop: 8 }}>
              Click on the map to adjust your exact delivery pin for real-time tracking.
            </p>
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }} onClick={() => setSaveToProfile(!saveToProfile)}>
            {saveToProfile ? <CheckSquare size={20} color="var(--teal-600)" /> : <Square size={20} color="var(--slate-300)" />}
            <span style={{ fontSize: '.9rem', color: 'var(--slate-600)', fontWeight: 600 }}>Save this as my primary address in my profile</span>
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12, marginTop: 12, borderTop: '1px solid var(--slate-100)', paddingTop: 20 }}>
            <button type="submit" className="btn-primary" style={{ flex: 1, height: 48 }}>
              <Save size={18} /> Confirm Address
            </button>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1, height: 48 }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
