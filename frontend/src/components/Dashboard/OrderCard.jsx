import React from 'react';
import { Package, MessageSquare, ShoppingBag, FileText, ExternalLink, CheckCircle, Star, CreditCard, Shield } from 'lucide-react';
import TrackingMap from '../TrackingMap';

const Badge = ({ status }) => {
  const styles = {
    pending: { bg: 'var(--amber-50)', text: 'var(--amber-700)', border: 'var(--amber-200)' },
    pending_approval: { bg: 'var(--amber-50)', text: 'var(--amber-700)', border: 'var(--amber-200)' },
    negotiating: { bg: 'var(--sky-50)', text: 'var(--sky-700)', border: 'var(--sky-200)' },
    accepted: { bg: 'var(--teal-50)', text: 'var(--teal-700)', border: 'var(--teal-200)' },
    processing: { bg: 'var(--teal-500)', text: '#fff', border: 'transparent' },
    shipped: { bg: 'var(--slate-900)', text: '#fff', border: 'transparent' },
    out_for_delivery: { bg: 'var(--indigo-600)', text: '#fff', border: 'transparent' },
    completed: { bg: 'var(--green-50)', text: 'var(--green-700)', border: 'var(--green-200)' },
    cancelled: { bg: 'var(--red-50)', text: 'var(--red-700)', border: 'var(--red-200)' },
    payment_failed: { bg: 'var(--red-500)', text: '#fff', border: 'transparent' }
  };
  const s = styles[status] || styles.pending;
  return (
    <span style={{ 
      background: s.bg, 
      color: s.text, 
      borderColor: s.border,
      padding: '4px 10px', 
      borderRadius: 6, 
      fontSize: '.65rem', 
      fontWeight: 800, 
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      border: '1px solid currentColor'
    }}>
      {status.replace(/_/g, ' ')}
    </span>
  );
};

const OrderCard = ({ order, isCompany, openChat, handleStatusUpdate, handleAccept, handleNegotiate, handleReject, handleCancel, setPayModal, setShowReview, proposedRates, setProposedRates, proposedDates, setProposedDates, otpInputs, setOtpInputs, API }) => {
  return (
    <div key={order._id} className="card order-card" style={{ borderLeft: `6px solid ${order.status === 'completed' ? 'var(--green-500)' : order.status === 'cancelled' ? 'var(--red-500)' : 'var(--teal-600)'}` }}>
      <div className="order-header">
        <div>
          <p className="order-title" style={{ fontSize: '1.1rem' }}>
            #{order._id.slice(-6).toUpperCase()} — {order.type === 'custom' ? `🛠️ Custom Part: ${order.description?.slice(0, 30)}...` : (order.product?.name || 'Standard Item')}
          </p>
          <p className="order-desc">Ordered on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <Badge status={order.status} />
      </div>

      {(['shipped', 'out_for_delivery', 'completed', 'processing'].includes(order.status) || (!isCompany && order.status === 'accepted')) && (
        <div style={{ margin: '16px 0' }}>
           <TrackingMap origin={order.company?.location} destination={order.customer?.location} current={order.currentLocation} status={order.status} />
        </div>
      )}

      <div className="order-stats-row" style={{ display: 'flex', gap: 24, fontSize: '.85rem', color: 'var(--slate-600)', background: 'var(--slate-50)', padding: '14px 20px', borderRadius: 12, border: '1px solid var(--slate-100)', flexWrap: 'wrap', alignItems: 'center' }}>
         <div>
           <p style={{ fontSize: '.65rem', textTransform: 'uppercase', fontWeight: 700, opacity: 0.6, margin: 0 }}>Proposed/Final Rate</p>
           <p style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--slate-900)', margin: 0 }}>₹{(order.finalRate || order.proposedRate || 0).toLocaleString()}</p>
         </div>
         <div className="stat-divider-v" style={{ height: 30, width: 1, background: 'var(--slate-200)' }} />
         <div>
           <p style={{ fontSize: '.65rem', textTransform: 'uppercase', fontWeight: 700, opacity: 0.6, margin: 0 }}>Timeline</p>
           <p style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--slate-700)', margin: 0 }}>{order.finalDeliveryDate ? new Date(order.finalDeliveryDate).toLocaleDateString() : (order.proposedDeliveryDate ? new Date(order.proposedDeliveryDate).toLocaleDateString() : 'Under Negotiation')}</p>
         </div>
         
         <div className="order-actions" style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-chat" onClick={() => openChat(order)} style={{ background: '#fff' }}><MessageSquare size={16}/> Chat</button>
            {order.status === 'accepted' && !isCompany && (
              <button className="btn-pay" onClick={() => setPayModal({ amount: order.finalRate || order.proposedRate, productName: order.product?.name || 'Order Payment', orderId: order._id })}>Pay Now</button>
            )}
            {order.status === 'payment_failed' && !isCompany && (
              <button className="btn-pay" onClick={() => setPayModal({ amount: order.finalRate || order.proposedRate, productName: order.product?.name || 'Order Payment', orderId: order._id })}>Retry Pay</button>
            )}
         </div>
      </div>
      
      {/* Drawings */}
      {order.drawings?.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {order.drawings.map((dw, i) => (
            <a key={i} href={dw.startsWith('/uploads') ? `${API}${dw}` : dw} target="_blank" rel="noreferrer" style={{ fontSize: '.7rem', display: 'flex', alignItems: 'center', gap: 4, background: 'var(--teal-50)', color: 'var(--teal-700)', padding: '4px 10px', borderRadius: 99, border: '1px solid var(--teal-100)' }}>
               <FileText size={12}/> Blueprint {i+1} <ExternalLink size={10}/>
            </a>
          ))}
        </div>
      )}

      {/* ── COMPANY ACTIONS: APPROVAL & NEGOTIATION ── */}
      {isCompany && (order.status === 'pending_approval' || order.status === 'pending' || order.status === 'negotiating') && (
        <div className="negotiation-box warning" style={{ marginTop: 16 }}>
          <p className="neg-label">
            {order.status === 'pending_approval' ? '🆕 Manual Approval Needed — Customer ordered ₹' : 
             order.status === 'pending' ? '🔔 New Order — Customer proposed ₹' : 
             '🔄 Counter offer made — Current rate ₹'}
            <strong>{(order.proposedRate || order.finalRate || 0).toLocaleString()}</strong>
          </p>
          <div className="neg-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginBottom: 8 }}>
            <div>
              <label className="form-label" style={{ fontSize: '.75rem' }}>Counter Rate (₹)</label>
              <input className="rate-input" style={{ width: '100%' }} type="number" value={proposedRates[order._id] || ''} onChange={e => setProposedRates(r => ({ ...r, [order._id]: e.target.value }))} />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '.75rem' }}>Delivery Date</label>
              <input className="form-input" style={{ fontSize: '.8rem' }} type="date" value={proposedDates[order._id] || ''} onChange={e => setProposedDates(d => ({ ...d, [order._id]: e.target.value }))} />
            </div>
          </div>
          <div className="neg-actions">
            <button className="btn-accept" onClick={() => handleAccept(order._id)}>✅ Approve & Accept Rate</button>
            <button className="btn-propose" onClick={() => handleNegotiate(order._id)}>📤 Propose Counter</button>
            <button className="btn-reject" onClick={() => handleReject(order._id)}>❌ Reject Order</button>
          </div>
        </div>
      )}

      {/* ── COMPANY: Ships after payment ── */}
      {isCompany && order.status === 'accepted' && (
        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="btn-accept" onClick={() => handleStatusUpdate(order._id, 'processing')}>🏗️ Start Processing</button>
          <button className="btn-reject" onClick={() => handleCancel(order._id)}>❌ Reject Order</button>
        </div>
      )}

      {/* ── COMPANY: Processing stages ── */}
      {isCompany && (order.status === 'processing' || order.status === 'shipped') && (
        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {order.status === 'processing' && <button className="btn-accept" onClick={() => handleStatusUpdate(order._id, 'shipped')}>🚀 Ready to Ship</button>}
          {order.status === 'shipped' && <button className="btn-accept" style={{ background: 'var(--blue-500)' }} onClick={() => handleStatusUpdate(order._id, 'out_for_delivery')}>🚚 Out for Delivery</button>}
          <button className="btn-reject" onClick={() => handleCancel(order._id)}>❌ Cancel Order</button>
        </div>
      )}

      {/* ── COMPANY: Completes via OTP ── */}
      {isCompany && (order.status === 'shipped' || order.status === 'out_for_delivery') && (
        <div style={{ marginTop: 12, padding: 12, background: 'var(--sky-50)', borderRadius: 12, border: '1px solid var(--sky-200)' }}>
          <p style={{ fontSize: '.75rem', fontWeight: 700, marginBottom: 8, color: 'var(--sky-700)' }}>Delivery Verification Needed</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input placeholder="OTP Code" className="form-input" style={{ width: 120 }} maxLength={6} value={otpInputs[order._id] || ''} onChange={e => setOtpInputs(prev => ({ ...prev, [order._id]: e.target.value }))} />
            <button className="btn-accept" onClick={() => handleStatusUpdate(order._id, 'completed')}>Verify & Complete</button>
          </div>
        </div>
      )}

      {/* ── CUSTOMER: Negotiating ── */}
      {!isCompany && order.status === 'negotiating' && (
        <div className="negotiation-box" style={{ marginTop: 16 }}>
          <p className="neg-label">🔄 Vendor proposed a new rate</p>
          <p style={{ fontSize: '.875rem', color: 'var(--slate-700)' }}>
            Vendor is requesting <strong style={{ color: 'var(--teal-700)' }}>₹{(order.proposedRate || 0).toLocaleString()}</strong> by {new Date(order.proposedDeliveryDate).toLocaleDateString()}
          </p>
          <div className="neg-actions">
            <button className="btn-accept" onClick={() => handleAccept(order._id)}>✅ Accept New Rate</button>
            <button className="btn-chat" onClick={() => openChat(order)}> Negotiate via Chat</button>
          </div>
        </div>
      )}

      {/* OTP Display for Customer */}
      {(order.status === 'shipped' || order.status === 'out_for_delivery') && !isCompany && (
        <div style={{ marginTop: 16, padding: 16, background: 'var(--slate-900)', borderRadius: 16, color: '#fff', textAlign: 'center' }}>
           <p style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, opacity: 0.6, marginBottom: 8 }}>Delivery Verification Code (OTP)</p>
           <p style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: 6, margin: 0 }}>{order.deliveryOtp || order.completionOTP || '625894'}</p>
           <p style={{ fontSize: '.75rem', color: 'var(--slate-400)', marginTop: 8 }}>Share this with the delivery executive only when you receive your package.</p>
        </div>
      )}

      {/* Completed State */}
      {order.status === 'completed' && (
        <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
           <span style={{ fontSize: '.8rem', color: 'var(--green-500)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><CheckCircle size={15}/> Order Completed</span>
           {!isCompany && !order.hasReviewed && (
             <button className="btn-propose" style={{ background: 'var(--amber-400)' }} onClick={() => setShowReview(order)}><Star size={13}/> Rate Service</button>
           )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
