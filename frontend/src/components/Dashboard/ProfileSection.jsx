import React from 'react';
import { UserCircle, Star, Shield, MapPin, Edit3 } from 'lucide-react';

const ProfileSection = ({ user, myReviews }) => {
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

  return (
    <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Profile Info Card */}
      <div className="card" style={{ display: 'flex', gap: 24, padding: 32, alignItems: 'center' }}>
        <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'var(--teal-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fff', boxShadow: 'var(--shadow-md)' }}>
          <UserCircle size={60} color="var(--teal-600)" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>{user.name}</h2>
            <span style={{ fontSize: '.7rem', background: 'var(--teal-100)', color: 'var(--teal-700)', padding: '2px 8px', borderRadius: 4, fontWeight: 700, textTransform: 'uppercase' }}>{user.role}</span>
          </div>
          <p style={{ color: 'var(--slate-500)', margin: '0 0 12px 0' }}>{user.email}</p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '.85rem', color: 'var(--slate-600)' }}>
              <MapPin size={16} /> {user.address || 'Address not set'}
            </div>
          </div>
        </div>
        <button className="btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={() => alert('Profile editing coming soon!')}>
          <Edit3 size={16} /> Edit Profile
        </button>
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
