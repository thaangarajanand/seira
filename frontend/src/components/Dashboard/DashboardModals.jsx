import React, { useState } from 'react';
import { Star, Package, UserCircle } from 'lucide-react';

const StarRating = ({ value, onChange, readOnly = false, size = 20 }) => {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="stars" style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          className={`star ${(hovered || value) >= n ? 'active' : ''}`}
          style={{ 
            fontSize: size, 
            cursor: readOnly ? 'default' : 'pointer', 
            userSelect: 'none',
            color: (hovered || value) >= n ? 'var(--amber-400)' : 'var(--slate-300)',
            transition: 'all 0.2s'
          }}
          onClick={() => !readOnly && onChange && onChange(n)}
          onMouseEnter={() => !readOnly && setHovered(n)}
          onMouseLeave={() => !readOnly && setHovered(0)}
        >
          { (hovered || value) >= n ? '★' : '☆' }
        </span>
      ))}
    </div>
  );
};

export const MockPayModal = ({ amount, label, onSuccess, onClose }) => {
  const [loading, setLoading] = useState(false);
  const handlePay = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    onSuccess();
  };
  return (
    <div className="modal-overlay">
      <div className="mock-pay-modal">
        <div className="mock-pay-logo">razorpay</div>
        <p style={{ fontSize: '.8rem', color: '#666', marginBottom: 4 }}>Payment for</p>
        <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '.9rem' }}>{label}</p>
        <div className="mock-pay-amount">₹{Number(amount).toLocaleString('en-IN')}</div>
        <p className="mock-pay-note">🧪 Test Mode — No real money charged</p>
        <button className="btn-mock-pay" onClick={handlePay} disabled={loading}>
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
        <button onClick={onClose} style={{ marginTop: 12, color: '#94a3b8', fontSize: '.8rem', display: 'block', width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export const ReviewModal = ({ order, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!rating) return alert('Please select a rating');
    setLoading(true);
    await onSubmit(order, rating, comment);
    setLoading(false);
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 440 }}>
        <h2 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>Rate Your Experience</h2>
        <p className="modal-sub" style={{ fontSize: '.85rem', color: 'var(--slate-500)', marginBottom: 20 }}>
          For order with <strong>{order.company?.companyName || 'the vendor'}</strong>
        </p>
        <div style={{ marginBottom: 20 }}>
          <label className="form-label">Your Rating</label>
          <StarRating value={rating} onChange={setRating} size={32} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label className="form-label">Comment (optional)</label>
          <textarea
            className="form-input"
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Share your experience with this vendor..."
            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid var(--slate-200)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Review'}
          </button>
          <button className="btn-reject" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

export const UserDetailsModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 520 }}>
        <h2 className="modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>User Details</h2>
        <p className="modal-sub" style={{ fontSize: '.85rem', color: 'var(--slate-500)', marginBottom: 20 }}>
          Governance view for <strong>{user.name}</strong>
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          {[
            ['Name', user.name],
            ['Email', user.email],
            ['Role', user.role],
            ['Approved', user.isApproved ? 'Yes' : 'No'],
            ['Suspended', user.isSuspended ? 'Yes' : 'No'],
            ['Phone', user.phone || 'Not provided'],
            ['Address', user.address || 'Not provided'],
            ['Company', user.companyName || 'Not provided'],
            ['Preferred Language', user.preferredLanguage || 'en']
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--slate-50)', border: '1px solid var(--slate-200)' }}>
              <strong style={{ color: 'var(--slate-700)' }}>{label}</strong>
              <span style={{ color: 'var(--slate-900)', wordBreak: 'break-word' }}>{value}</span>
            </div>
          ))}
        </div>

        <button className="btn-secondary" style={{ width: '100%', marginTop: 18 }} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};
