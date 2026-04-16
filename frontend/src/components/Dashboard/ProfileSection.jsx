import React, { useState } from 'react';
import { UserCircle, Star, Shield, MapPin, Edit3, Phone, Save, X, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProfileSection = ({ user, myReviews, API }) => {
  const { token, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    address: user.address || '',
    bio: user.bio || '',
    location: user.location || { lat: null, lng: null }
  });
  const [saveLoading, setSaveLoading] = useState(false);

  const StarRating = ({ value, size = 16 }) => {
    return (
      <div style={{ display: 'flex', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            size={size} 
            fill={star <= value ? 'var(--amber-400)' : 'none'} 
            stroke={star <= value ? 'var(--amber-400)' : 'var(--slate-300)'} 
          />
        ))}
      </div>
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const updated = await res.json();
        updateUser(updated);
        setIsEditing(false);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      alert('Network error updating profile');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Profile Info Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 32 }}>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--teal-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fff', boxShadow: 'var(--shadow-md)', flexShrink: 0 }}>
            <UserCircle size={60} color="var(--teal-600)" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{user.name}</h2>
              <span style={{ fontSize: '.7rem', background: 'var(--teal-100)', color: 'var(--teal-700)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>{user.role}</span>
            </div>
            <p style={{ color: 'var(--slate-500)', margin: '0 0 12px 0' }}>{user.email}</p>
            {!isEditing && (
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.85rem', color: 'var(--slate-600)' }}>
                  <MapPin size={16} /> {user.address || 'Address not set'}
                </div>
                {user.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.85rem', color: 'var(--slate-600)' }}>
                    <Phone size={16} /> {user.phone}
                  </div>
                )}
              </div>
            )}
          </div>
          <button 
            className="btn-secondary" 
            style={{ alignSelf: 'flex-start' }} 
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? <><X size={16} /> Cancel</> : <><Edit3 size={16} /> Edit Profile</>}
          </button>
        </div>

        {isEditing && (
          <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderTop: '1px solid var(--slate-100)', paddingTop: 24 }}>
            <div className="form-group-v2">
              <label>Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div className="form-group-v2">
              <label>Phone Number</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="+91 99999 99999" />
            </div>
            <div className="form-group-v2" style={{ gridColumn: 'span 2' }}>
              <label>Primary Business Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="Factory / Office Address" />
            </div>
            <div className="form-group-v2" style={{ gridColumn: 'span 2' }}>
              <label>Professional Bio / Company Description</label>
              <textarea 
                name="bio" 
                value={formData.bio} 
                onChange={handleChange} 
                rows="3" 
                placeholder="Tell others about your manufacturing capabilities or procurement needs..."
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--slate-200)' }}
              ></textarea>
            </div>
            <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="submit" className="btn-primary" disabled={saveLoading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {saveLoading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          </form>
        )}

        {user.bio && !isEditing && (
          <div style={{ borderTop: '1px solid var(--slate-100)', paddingTop: 20 }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '.9rem', color: 'var(--slate-700)', display: 'flex', alignItems: 'center', gap: 6 }}><Info size={16}/> Professional Bio</h4>
            <p style={{ fontSize: '.9rem', color: 'var(--slate-600)', margin: 0, lineHeight: 1.6 }}>{user.bio}</p>
          </div>
        )}
      </div>

      {/* Industrial Certificates / Reviews Section */}
      <div className="card">
        <h3 style={{ marginBottom: 20 }}>Manufacturing Reviews & Performance</h3>
        {myReviews.length === 0 ? (
          <div className="empty-state-v2">
            <div className="empty-state-icon"><Star size={24} /></div>
            <p>No industrial performance reviews yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {myReviews.map(r => (
              <div key={r._id} style={{ padding: 20, background: 'var(--slate-50)', borderRadius: 12, border: '1px solid var(--slate-200)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontWeight: 700, margin: 0 }}>{r.product?.name}</p>
                  <StarRating value={r.rating} readOnly size={14} />
                </div>
                <p style={{ fontSize: '.85rem', color: 'var(--slate-600)', margin: 0 }}>"{r.comment}"</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, alignItems: 'center' }}>
                   <p style={{ fontSize: '.7rem', color: 'var(--slate-400)', margin: 0 }}>Verified Transaction on {new Date(r.createdAt).toLocaleDateString()}</p>
                   {r.certified && <span style={{ fontSize: '.65rem', background: 'var(--teal-600)', color: '#fff', padding: '1px 6px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Shield size={10}/> Quality Certified</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSection;
