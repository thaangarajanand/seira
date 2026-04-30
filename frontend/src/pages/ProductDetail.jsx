import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, Star, Zap, Shield, ArrowLeft, Loader2, 
  Settings, CheckCircle, Package, Truck, MessageSquare, 
  MapPin, Clock, Award, Info, Sparkles, UploadCloud, FileText, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_BASE_URL as API } from '../api';
import CheckoutAddressModal from '../components/CheckoutAddressModal';

// ── Components (Sub-components) ───────────────────────────

function StarRating({ value, onChange, readOnly = false, size = 20 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="stars">
      {[1,2,3,4,5].map(n => (
        <span
          key={n}
          className={`star ${(hovered || value) >= n ? 'active' : ''}`}
          style={{ fontSize: size, cursor: readOnly ? 'default' : 'pointer', userSelect: 'none' }}
          onClick={() => !readOnly && onChange && onChange(n)}
          onMouseEnter={() => !readOnly && setHovered(n)}
          onMouseLeave={() => !readOnly && setHovered(0)}
        >★</span>
      ))}
    </div>
  );
}

function MockPayModal({ amount, productName, onSuccess, onClose }) {
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
        <div className="mock-pay-logo" style={{fontSize:'1.5rem', fontWeight:'bold', color:'#334155'}}>Secure Checkout</div>
        <p style={{ fontSize: '.8rem', color: '#666', marginBottom: 4 }}>Processing payment for</p>
        <p style={{ fontWeight: 700, color: '#1e293b' }}>{productName}</p>
        <div className="mock-pay-amount">₹{Number(amount).toLocaleString('en-IN')}</div>
        <button className="btn-mock-pay" onClick={handlePay} disabled={loading} style={{marginTop: 16}}>
          {loading ? 'Processing...' : 'Complete Payment'}
        </button>
        <button onClick={onClose} style={{ marginTop: 12, color: '#94a3b8', fontSize: '.8rem', display: 'block', width: '100%' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

function CustomizeModal({ product, onClose, user }) {
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ proposedRate: product.price || '', expectedDate: '', description: '', quantity: 1, dimensions: '' });
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef();

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => {
      const ok = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(f.type);
      return ok && f.size <= 10 * 1024 * 1024;
    });
    setFiles(prev => [...prev, ...valid].slice(0, 5));
  };
  // const removeFile = (i) => setFiles(f => f.filter((_, idx) => idx !== i));

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const handleAIEnhance = async () => {
    if (!form.description.trim() && !form.dimensions.trim()) return alert('Please enter some basic requirements first.');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/ai/refine`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: form.description, dimensions: form.dimensions })
      });
      if (res.ok) {
        const { refined } = await res.json();
        setForm(f => ({ ...f, description: refined }));
      }
    } catch (err) { console.error('AI Refinement failed:', err); }
    finally { setSubmitting(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.address || !user?.location) {
      alert('📍 Please update your delivery address and location in your profile before submitting a custom request.');
      onClose();
      return;
    }
    if (files.length === 0) return setError('Please upload at least one drawing or blueprint.');
    setSubmitting(true);
    try {
      const formData = new FormData();
      files.forEach(f => formData.append('drawings', f));
      const uploadRes = await fetch(`${API}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (!uploadRes.ok) throw new Error('File upload failed');
      const { urls } = await uploadRes.json();

      const orderRes = await fetch(`${API}/api/orders`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'custom',
          product: product._id,
          company: product.companyId._id || product.companyId,
          proposedRate: Number(form.proposedRate),
          proposedDeliveryDate: form.expectedDate,
          description: form.description,
          quantity: Number(form.quantity),
          drawings: urls
        })
      });
      if (!orderRes.ok) throw new Error('Failed to submit order');
      alert('Customization request submitted successfully!');
      onClose();
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '40px', overflowY: 'auto' }}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Customize {product.name}</h2>
          <button onClick={onClose} style={{ color: 'var(--slate-400)', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="form-section">
          {error && <div className="error-box">{error}</div>}
          <div className={`upload-zone ${files.length > 0 ? 'has-files' : ''} ${dragOver ? 'has-files' : ''}`} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop} onClick={() => fileRef.current?.click()}>
            <UploadCloud size={32} style={{ color: files.length > 0 ? 'var(--teal-500)' : 'var(--slate-400)', marginBottom: 8 }} />
            <p style={{ fontWeight: 600, fontSize: '.85rem' }}>{files.length === 0 ? 'Drop files or click to browse' : `${files.length} file(s) selected`}</p>
            <input ref={fileRef} type="file" multiple accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
          </div>
          <div className="form-row">
            <div><label className="form-label">Proposed Rate (₹)</label><input className="form-input" type="number" required value={form.proposedRate} onChange={update('proposedRate')} /></div>
            <div><label className="form-label">Quantity</label><input className="form-input" type="number" required value={form.quantity} onChange={update('quantity')} /></div>
          </div>
          <div><label className="form-label">Need Delivery On</label><input className="form-input" type="date" required value={form.expectedDate} onChange={update('expectedDate')} /></div>
          <div><label className="form-label">Notes</label><textarea className="form-input" rows={3} value={form.description} onChange={update('description')} /><div className="ai-hint" onClick={handleAIEnhance}><Sparkles size={12} /> ✨ Enhance with AI</div></div>
          <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Processing...' : 'Submit Request'}</button>
        </form>
      </div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────

export default function ProductDetail() {
  const { id } = useParams();
  const { isLoggedIn, user, updateUser } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canReview, setCanReview] = useState(null); // { canReview, orderId, companyId }
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [payModal, setPayModal] = useState(null);
  const [customizeModal, setCustomizeModal] = useState(null);
  const [addressModal, setAddressModal] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [payConfig, setPayConfig] = useState({ mock: true, keyId: null });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, revRes] = await Promise.all([
        fetch(`${API}/api/products/${id}`, { credentials: 'include' }),
        fetch(`${API}/api/reviews/product/${id}`, {
          credentials: 'include'
        })
      ]);
      if (prodRes.ok) setProduct(await prodRes.json());
      if (revRes.ok) setReviews(await revRes.json());

      if (isLoggedIn) {
        const canRevRes = await fetch(`${API}/api/reviews/can-review-product/${id}`, {
          credentials: 'include'
        });
        if (canRevRes.ok) setCanReview(await canRevRes.json());
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [id, isLoggedIn]);

  useEffect(() => {
    fetch(`${API}/api/payment/config`, { credentials: 'include' }).then(r => r.json()).then(setPayConfig).catch(() => {});
    fetchData();
  }, [fetchData]);

  const handleBuyNow = async () => {
    if (!isLoggedIn) return navigate('/login');
    if (!window.Razorpay && !payConfig.mock) {
      alert('Razorpay SDK failed to load.');
      return;
    }

    if (!selectedAddress && (!user?.street || !user?.location)) {
      setAddressModal(true);
      return;
    }
    
    try {
      const addr = selectedAddress || {
        name: user.name,
        phone: user.phone,
        street: user.street,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        lat: user.location?.lat,
        lng: user.location?.lng
      };

      const orderRes = await fetch(`${API}/api/orders`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'standard', 
          product: product._id, 
          proposedRate: product.price, 
          quantity: 1,
          deliveryAddress: addr
        })
      });
      const order = await orderRes.json();
      const payRes = await fetch(`${API}/api/payment/create-order`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: product.price, orderId: order._id })
      });
      const payOrder = await payRes.json();
      setPayModal({ orderId: order._id, payOrderId: payOrder.id });
    } catch (err) { console.error(err); }
  };

  const handlePaymentSuccess = async () => {
    try {
      await fetch(`${API}/api/payment/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          razorpay_order_id: payModal.payOrderId, 
          razorpay_payment_id: 'mock_detail_' + Date.now(), 
          razorpay_signature: 'mock', 
          orderId: payModal.orderId, 
          mock: true 
        })
      });
      setPayModal(null);
      alert('✅ Payment Successful! Your order is being processed.');
      navigate('/dashboard');
    } catch (err) { console.error(err); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) return alert('Please select a rating');
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API}/api/reviews`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: canReview.companyId,
          orderId: canReview.orderId,
          product: id,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        })
      });
      if (res.ok) {
        alert('✅ Review submitted! Thank you.');
        setReviewForm({ rating: 0, comment: '' });
        fetchData();
      }
    } catch (err) { console.error(err); }
    finally { setSubmittingReview(false); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!product) return <div className="page-container"><div className="empty-state"><p>Product not found.</p></div></div>;

  return (
    <div className="page-container" style={{maxWidth: 1100}}>
      {payModal && <MockPayModal amount={product.price} productName={product.name} onSuccess={handlePaymentSuccess} onClose={() => setPayModal(null)} />}
      {customizeModal && <CustomizeModal product={product} user={user} onClose={() => setCustomizeModal(null)} />}
      
      {addressModal && (
        <CheckoutAddressModal 
          user={user} 
          initialAddress={selectedAddress} 
          onClose={() => setAddressModal(false)} 
          onSave={async (addr, saveToProfile) => {
            setSelectedAddress(addr);
            if (saveToProfile) {
              try {
                const res = await fetch(`${API}/api/auth/profile`, {
                  method: 'PUT',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(addr)
                });
                if (res.ok) {
                  const updated = await res.json();
                  updateUser(updated);
                }
              } catch (err) { console.error('Profile sync failed:', err); }
            }
            setAddressModal(false);
          }} 
        />
      )}

      <Link to="/products" className="btn-secondary" style={{ padding: '8px 12px', marginBottom: 24, fontSize: '.85rem' }}>
        <ArrowLeft size={16} /> Back to Catalog
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>
        {/* Left: Gallery */}
        <div style={{ position: 'sticky', top: 92 }}>
          <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', border: '1px solid var(--slate-200)', boxShadow: 'var(--shadow)' }}>
            <img 
              src={product.imageUrl?.startsWith('/uploads') ? `${API}${product.imageUrl}` : product.imageUrl} 
              alt={product.name} 
              style={{ width: '100%', height: 450, objectFit: 'cover' }}
              onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=0D9488&color=fff&size=500&bold=true`; }}
            />
          </div>
          <div style={{ marginTop: 20, display: 'flex', gap: 12 }}>
            <div style={{ padding: 16, background: 'var(--teal-50)', borderRadius: 12, border: '1px solid var(--teal-100)', flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Shield size={24} color="var(--teal-600)" />
              <div>
                <p style={{ fontSize: '.85rem', fontWeight: 700, color: 'var(--teal-800)' }}>Manufacturer Warranty</p>
                <p style={{ fontSize: '.75rem', color: 'var(--teal-600)' }}>12 Months Standard Coverage</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Info */}
        <div>
          <span className="badge-accepted badge" style={{ marginBottom: 16 }}>{product.category}</span>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--slate-900)', lineHeight: 1.2, marginBottom: 8 }}>{product.name}</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <StarRating value={product.averageRating || 5} readOnly size={18} />
            <span style={{ fontSize: '.9rem', color: 'var(--slate-500)', fontWeight: 500 }}>({reviews.length} Verified Reviews)</span>
          </div>

          <div style={{ marginBottom: 32 }}>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--teal-700)' }}>₹{product.price.toLocaleString('en-IN')}</p>
            <p style={{ fontSize: '.85rem', color: 'var(--slate-400)' }}>Inclusive of all taxes & shipping</p>
            
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              {product.stock <= 0 ? (
                <span className="badge-cancelled badge" style={{ fontSize: '.85rem', padding: '6px 16px' }}>Out of Stock</span>
              ) : (
                <>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: product.stock < 5 ? '#f59e0b' : '#22c55e' }}></div>
                  <span style={{ fontSize: '.9rem', fontWeight: 600, color: product.stock < 5 ? '#d97706' : '#15803d' }}>
                    {product.stock < 5 ? `Only ${product.stock} left in stock!` : 'In Stock & Ready to Ship'}
                  </span>
                </>
              )}
            </div>
          </div>

          <p style={{ color: 'var(--slate-600)', fontSize: '1.05rem', lineHeight: 1.8, marginBottom: 32 }}>
            {product.description || "High-precision industrial component manufactured with global quality standards. Suitable for professional applications and robust environmental conditions."}
          </p>

          <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
            <button 
              className="btn-primary" 
              style={{ flex: 1, padding: 16, fontSize: '1rem', opacity: product.stock <= 0 ? 0.5 : 1, cursor: product.stock <= 0 ? 'not-allowed' : 'pointer' }} 
              onClick={handleBuyNow}
              disabled={product.stock <= 0}
            >
              <Zap size={18} fill="currentColor" /> {product.stock <= 0 ? 'Out of Stock' : 'Buy Now'}
            </button>
            <button 
              className="btn-secondary" 
              style={{ flex: 1, padding: 16, fontSize: '1rem', opacity: product.stock <= 0 ? 0.5 : 1, cursor: product.stock <= 0 ? 'not-allowed' : 'pointer' }} 
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
            >
               Add to Cart
            </button>
            <button 
              className="btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', fontSize: '0.9rem', fontWeight: 600 }} 
              onClick={() => setCustomizeModal(true)}
            >
              <Settings size={18} /> Customize
            </button>
          </div>

          {/* Vendor Snapshot */}
          <div className="card" style={{ background: 'var(--slate-50)', borderColor: 'var(--slate-200)', marginBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: '.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--slate-500)' }}>Manufacturer Detail</h3>
              <Link to="/dashboard" style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--teal-600)' }}>View Portfolio →</Link>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--teal-600)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 800 }}>
                {product.companyId?.companyName?.[0] || 'V'}
              </div>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{product.companyId?.companyName || 'SEIRA Certified Vendor'}</h4>
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  <span style={{ fontSize: '.8rem', color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Star size={14} color="var(--amber-400)" fill="var(--amber-400)" /> {product.companyId?.averageRating || '5.0'}
                  </span>
                  <span style={{ fontSize: '.8rem', color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Package size={14} color="var(--teal-500)" /> {product.companyId?.completedOrdersCount || '10+'} Orders
                  </span>
                </div>
              </div>
            </div>
            <p style={{ marginTop: 12, fontSize: '.85rem', color: 'var(--slate-500)' }}>{product.companyId?.bio || "Expert in industrial manufacturing with over 10 years of experience in high-precision parts."}</p>
          </div>
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--slate-200)', margin: '60px 0' }} />

      {/* Bottom: Tabs/Reviews */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 60 }}>
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 24 }}>Technical Specifications</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { l: 'Material', v: 'Industrial Grade Alloy' },
              { l: 'Certification', v: 'ISO 9001:2015' },
              { l: 'Lead Time', v: '5-7 Business Days' },
              { l: 'Origin', v: 'Make in India' },
              { l: 'Weight', v: '1.2 kg' },
              { l: 'Dimensions', v: 'Standard' }
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: i % 2 === 0 ? 'var(--slate-50)' : '#fff', borderRadius: 8 }}>
                <span style={{ color: 'var(--slate-500)', fontSize: '.9rem' }}>{s.l}</span>
                <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{s.v}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Customer Reviews</h3>
            {canReview?.canReview && <div className="badge-accepted badge">Verified Buyer</div>}
          </div>

          {canReview?.canReview && (
            <div className="card" style={{ marginBottom: 32, border: '1.5px solid var(--teal-200)', background: 'var(--teal-50)' }}>
              <h4 style={{ fontWeight: 800, marginBottom: 12 }}>Share your experience</h4>
              <form onSubmit={handleReviewSubmit}>
                <div style={{ marginBottom: 12 }}><StarRating value={reviewForm.rating} onChange={v => setReviewForm(f => ({ ...f, rating: v }))} size={28} /></div>
                <textarea className="form-input" placeholder="What did you think of this part?" rows={3} value={reviewForm.comment} onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))} style={{ background: '#fff' }} />
                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={submittingReview}>
                  {submittingReview ? 'Posting...' : 'Post Review'}
                </button>
              </form>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--slate-400)', textAlign: 'center', padding: 40 }}>No reviews yet. Be the first to buy and review!</p>
            ) : (
              reviews.map(r => (
                <div key={r._id} style={{ paddingBottom: 20, borderBottom: '1px solid var(--slate-100)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: '.9rem' }}>{r.customer?.name}</span>
                    <span style={{ fontSize: '.75rem', color: 'var(--slate-400)' }}>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <StarRating value={r.rating} readOnly size={14} />
                  <p style={{ marginTop: 8, fontSize: '.9rem', color: 'var(--slate-600)', lineHeight: 1.5 }}>{r.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
