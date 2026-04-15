import { useState, useEffect, useCallback, useRef } from 'react';
import { ShoppingBag, Star, Zap, Search, Filter, UploadCloud, FileText, X, Sparkles, Loader2, Settings, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { API_BASE_URL as API } from '../api';

// ── Mock Payment Overlay ─────────────────────────────────
function MockPayModal({ amount, productName, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);
  const handlePay = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200)); // simulate processing
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

function CustomizeModal({ product, onClose, token }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ proposedRate: product.price || '', expectedDate: '', description: '', quantity: 1, dimensions: '' });
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  // topCompany state removed as it was unused
  const fileRef = useRef();
  const { addToCart } = useCart();

  // useEffect for topCompany removed as it was unused

  const update = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f => {
      const ok = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'].includes(f.type);
      return ok && f.size <= 10 * 1024 * 1024;
    });
    setFiles(prev => [...prev, ...valid].slice(0, 5));
  };
  const removeFile = (i) => setFiles(f => f.filter((_, idx) => idx !== i));

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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ description: form.description, dimensions: form.dimensions })
      });
      if (res.ok) {
        const { refined } = await res.json();
        setForm(f => ({ ...f, description: refined }));
      }
    } catch (err) {
      console.error('AI Refinement failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (files.length === 0) {
      setError('Please upload at least one drawing or blueprint.');
      return;
    }
    setSubmitting(true);
    try {
      setUploading(true);
      const formData = new FormData();
      files.forEach(f => formData.append('drawings', f));
      const uploadRes = await fetch(`${API}/api/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!uploadRes.ok) throw new Error((await uploadRes.json()).error || 'File upload failed');
      const { urls } = await uploadRes.json();
      setUploading(false);

      // Add to Cart instead of immediate order
      addToCart(product, 'custom', {
        proposedRate: Number(form.proposedRate),
        proposedDeliveryDate: form.expectedDate,
        description: form.description,
        dimensions: form.dimensions,
        quantity: Number(form.quantity),
        drawings: urls
      });

      alert('Item added to cart with your custom requirements!');
      onClose();
    } catch (err) {
      setError(err.message);
      setUploading(false);
    } finally {
      setSubmitting(false);
    }
  };

  const hasContent = !!(form.description?.trim() || form.dimensions?.trim() || form.expectedDate || files.length > 0);

  return (
    <div className="modal-overlay" style={{ alignItems: 'flex-start', paddingTop: '40px', overflowY: 'auto' }}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Customize {product.name}</h2>
            <p style={{ fontSize: '.85rem', color: 'var(--slate-500)' }}>Request modifications directly from {product.companyId.companyName}</p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--slate-400)', fontSize: '1.5rem', lineHeight: 1 }}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="form-section">
          {error && <div className="error-box">{error}</div>}
          
          <div>
            <label className="form-label">Upload Drawings / Blueprints <span style={{ color: 'var(--red-500)' }}>*</span></label>
            <div
              className={`upload-zone ${files.length > 0 ? 'has-files' : ''} ${dragOver ? 'has-files' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <UploadCloud size={32} style={{ color: files.length > 0 ? 'var(--teal-500)' : 'var(--slate-400)', marginBottom: 8 }} />
              {files.length === 0 ? (
                <p style={{ fontWeight: 600, color: 'var(--slate-700)', fontSize: '.85rem' }}>Drop files or click to browse</p>
              ) : (
                <p style={{ fontWeight: 600, color: 'var(--teal-700)', fontSize: '.85rem' }}>{files.length} file{files.length > 1 ? 's' : ''} selected</p>
              )}
              <input ref={fileRef} type="file" multiple accept="image/*,.pdf" style={{ display: 'none' }} onChange={(e) => addFiles(e.target.files)} />
            </div>
            {files.length > 0 && (
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--teal-50)', borderRadius: 'var(--radius)', border: '1px solid var(--teal-100)' }}>
                    <FileText size={12} style={{ color: 'var(--teal-600)', flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: '.75rem', color: 'var(--slate-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                    <button type="button" onClick={() => removeFile(i)} style={{ color: 'var(--slate-400)', padding: 2 }}><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

            <div>
              <label className="form-label">Dimensions (LxWxH in mm)</label>
              <input className="form-input" type="text" placeholder="e.g. 150 x 50 x 20" value={form.dimensions} onChange={update('dimensions')} />
            </div>
          <div className="form-row">
            <div>
              <label className="form-label">Proposed Rate (₹) <span style={{ color: 'var(--red-500)' }}>*</span></label>
              <input className="form-input" type="number" required min="1" value={form.proposedRate} onChange={update('proposedRate')} />
            </div>
            <div>
              <label className="form-label">Quantity</label>
              <input className="form-input" type="number" min="1" value={form.quantity} onChange={update('quantity')} />
            </div>
          </div>
          <div>
            <label className="form-label">Need Delivery On <span style={{ color: 'var(--red-500)' }}>*</span></label>
            <input className="form-input" type="date" required value={form.expectedDate} onChange={update('expectedDate')} min={new Date().toISOString().split('T')[0]} />
          </div>
          <div>
            <label className="form-label">Material Requirements & Notes</label>
            <textarea className="form-input" rows={3} placeholder="Specify material grade, modifications needed..." value={form.description} onChange={update('description')} />
            <div className="ai-hint" onClick={handleAIEnhance}><Sparkles size={12} /> ✨ Enhance with AI</div>
          </div>

          {hasContent && (
            <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
              {submitting ? <><Loader2 size={16} style={{ animation: 'spin .7s linear infinite' }} /> {uploading ? 'Uploading...' : 'Submitting...'}</> : 'Submit'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [payModal, setPayModal] = useState(null);
  const [customizeModal, setCustomizeModal] = useState(null);
  const [payConfig, setPayConfig] = useState({ mock: true, keyId: null });
  
  // Rich Filtering State
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minRating: 0,
    inStock: false,
    showFilters: false
  });

  const { token } = useAuth();
  const { addToCart } = useCart();

  useEffect(() => {
    // Fetch payment config to know if we're in mock mode
    fetch(`${API}/api/payment/config`)
      .then(r => r.json())
      .then(setPayConfig)
      .catch(() => {});

    // Fetch products
    fetch(`${API}/api/products`)
      .then(r => r.json())
      .then(data => {
        const productList = Array.isArray(data) ? data : [];
        setProducts(productList);
        setFiltered(productList);
        
        // Extract unique categories
        const cats = ['All', ...new Set(productList.map(p => p.category).filter(Boolean))];
        setCategories(cats);
        
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    let result = products;

    if (selectedCategory !== 'All') {
      result = result.filter(p => p.category === selectedCategory);
    }

    if (q) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }

    // Rich Filtering
    if (filters.minPrice) result = result.filter(p => p.price >= Number(filters.minPrice));
    if (filters.maxPrice) result = result.filter(p => p.price <= Number(filters.maxPrice));
    if (filters.inStock) result = result.filter(p => (p.stock || 0) > 0);
    if (filters.minRating > 0) result = result.filter(p => (p.companyId?.averageRating || p.averageRating || 0) >= filters.minRating);

    setFiltered(result);
  }, [search, products, selectedCategory, filters]);

  const verifyPayment = useCallback(async (payload) => {
    try {
      const res = await fetch(`${API}/api/payment/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok && data.message === 'Payment verified successfully') {
        setPayModal(null);
        alert('✅ Payment Successful! Your order has been placed and is being processed.');
      } else {
        alert('❌ Payment failed or was cancelled. Your order status has been updated.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error during payment verification.');
    }
  }, [token]);

  const handlePaymentFailure = useCallback(async (orderId) => {
    try {
      await fetch(`${API}/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'payment_failed' })
      });
    } catch (err) { console.error('Failed to update status to payment_failed:', err); }
  }, [token]);

  const openRazorpay = useCallback((product, orderId, payOrder, keyId) => {
    const options = {
      key: keyId,
      amount: payOrder.amount,
      currency: payOrder.currency,
      name: 'SEIRA Marketplace',
      description: `Payment for ${product.name}`,
      image: 'https://ui-avatars.com/api/?name=BX&background=0D9488&color=fff',
      order_id: payOrder.id,
      handler: async (response) => {
        await verifyPayment({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature,
          orderId
        });
      },
      modal: {
        ondismiss: function() {
          handlePaymentFailure(orderId);
          alert('💳 Payment window closed. You can retry payment from your dashboard orders.');
        }
      },
      prefill: { name: 'Customer', email: 'customer@SEIRA.com', contact: '9999999999' },
      theme: { color: '#0D9488' }
    };
    new window.Razorpay(options).open();
  }, [verifyPayment, handlePaymentFailure]);

  const handleBuy = useCallback(async (product) => {
    if (!token) {
      alert('Please login to make a purchase.');
      window.location.href = '/login';
      return;
    }
    try {
      const orderRes = await fetch(`${API}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ type: 'standard', product: product._id, proposedRate: product.price, quantity: 1 })
      });
      if (!orderRes.ok) throw new Error('Failed to create order');
      const order = await orderRes.json();

      const payRes = await fetch(`${API}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: product.price, orderId: order._id })
      });
      if (!payRes.ok) throw new Error('Payment initialization failed');
      const payOrder = await payRes.json();

      if (payOrder.mock || payConfig.mock) {
        setPayModal({ product, orderId: order._id, amount: product.price, payOrderId: payOrder.id });
      } else {
        openRazorpay(product, order._id, payOrder, payConfig.keyId);
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'Payment initialization failed');
    }
  }, [token, payConfig, openRazorpay]);

  const handleMockSuccess = async () => {
    if (!payModal) return;
    await verifyPayment({
      razorpay_order_id: payModal.payOrderId,
      razorpay_payment_id: 'mock_pay_' + Date.now(),
      razorpay_signature: 'mock_sig',
      orderId: payModal.orderId,
      mock: true
    });
  };


  if (loading) return (
    <div className="page-container">
      <div className="loading-screen" style={{ minHeight: '60vh' }}>
        <div className="spinner" />
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {payModal && (
        <MockPayModal
          amount={payModal.amount}
          productName={payModal.product.name}
          onSuccess={handleMockSuccess}
          onClose={() => setPayModal(null)}
        />
      )}
      {customizeModal && (
        <CustomizeModal
          product={customizeModal}
          token={token}
          onClose={() => setCustomizeModal(null)}
        />
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16, marginBottom: 12 }}>
        <div>
          <h1 className="page-title">Standard Parts Catalog</h1>
          <p className="page-subtitle">Immediate purchase from top verified vendors • {filtered.length} products</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 36, width: 260 }}
          />
        </div>
      </div>

      <div className="category-filter-container" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <button 
          className="btn-secondary" 
          onClick={() => setFilters(f => ({ ...f, showFilters: !f.showFilters }))}
          style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '.85rem' }}
        >
          <Filter size={14} /> {filters.showFilters ? 'Hide Filters' : 'More Filters'}
        </button>
      </div>

      {filters.showFilters && (
        <div className="card" style={{ marginBottom: 24, padding: '16px 20px', background: 'var(--slate-50)', border: '1px solid var(--slate-200)', borderRadius: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            <div>
              <label className="form-label" style={{ fontSize: '.75rem' }}>Price Range (₹)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input 
                  type="number" className="form-input" placeholder="Min" style={{ padding: '6px 10px' }}
                  value={filters.minPrice} onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
                />
                <span style={{ color: 'var(--slate-400)' }}>-</span>
                <input 
                  type="number" className="form-input" placeholder="Max" style={{ padding: '6px 10px' }}
                  value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '.75rem' }}>Minimum Vendor Rating</label>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1,2,3,4,5].map(n => (
                  <button 
                    key={n} 
                    onClick={() => setFilters(f => ({ ...f, minRating: f.minRating === n ? 0 : n }))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                  >
                    <Star size={18} style={{ fill: filters.minRating >= n ? 'var(--amber-400)' : 'none', color: filters.minRating >= n ? 'var(--amber-400)' : 'var(--slate-300)' }} />
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '.9rem', color: 'var(--slate-700)', fontWeight: 600 }}>
                <input 
                  type="checkbox" 
                  checked={filters.inStock} 
                  onChange={e => setFilters(f => ({ ...f, inStock: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--teal-600)' }}
                />
                Show In-Stock Only
              </label>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}>
              <button 
                className="btn-link" 
                onClick={() => setFilters({ minPrice: '', maxPrice: '', minRating: 0, inStock: false, showFilters: true })}
                style={{ fontSize: '.8rem', color: 'var(--red-500)' }}
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <ShoppingBag size={48} />
          <p>No products found{search ? ` for "${search}"` : '. Run the seed script to add products.'}  </p>
        </div>
      ) : (
        <div className="product-grid">
          {filtered.map(product => (
            <div key={product._id} className="product-card">
              <Link to={`/products/${product._id}`}>
                <img
                  src={product.imageUrl?.startsWith('/uploads') ? `${API}${product.imageUrl}` : product.imageUrl}
                  alt={product.name}
                  className="product-img"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=0D9488&color=fff&size=300&bold=true`;
                  }}
                />
              </Link>
              <div className="product-body">
                <div className="product-vendor" style={{ flexWrap: 'wrap', gap: 6 }}>
                  {product.companyId?.averageRating > 0 ? (
                    <>
                      <Star size={11} style={{ color: 'var(--amber-400)', fill: 'var(--amber-400)' }} />
                      <span style={{ color: 'var(--amber-400)', fontWeight: 700 }}>{product.companyId.averageRating}</span>
                    </>
                  ) : product.averageRating > 0 ? (
                    <>
                      <Star size={11} style={{ color: 'var(--amber-400)', fill: 'var(--amber-400)' }} />
                      <span style={{ color: 'var(--amber-400)', fontWeight: 700 }}>{product.averageRating}</span>
                    </>
                  ) : null}
                  <span>• {product.companyId?.companyName || 'SEIRA Vendor'}</span>
                  {product.companyId?.completedOrdersCount > 0 && (
                    <span style={{ background: 'var(--teal-50)', color: 'var(--teal-700)', padding: '2px 6px', borderRadius: 4, fontSize: '.7rem', fontWeight: 600 }}>
                      ✓ {product.companyId.completedOrdersCount} Orders
                    </span>
                  )}
                </div>
                <Link to={`/products/${product._id}`}>
                  <h3 className="product-name">{product.name}</h3>
                </Link>
                {product.description && (
                  <p style={{ fontSize: '.8rem', color: 'var(--slate-500)', lineHeight: 1.5 }}>
                    {product.description}
                  </p>
                )}
                {product.companyId?.portfolioImages?.length > 0 && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                    {product.companyId.portfolioImages.map((img, idx) => (
                      <img key={idx} src={img} alt="Portfolio" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', border: '1px solid var(--slate-200)' }} />
                    ))}
                  </div>
                )}
                <p className="product-price">₹{product.price.toLocaleString('en-IN')}</p>
                {product.reviewCount > 0 && (
                  <p style={{ fontSize: '.75rem', color: 'var(--slate-400)', marginTop: -4 }}>
                    {product.reviewCount} review{product.reviewCount > 1 ? 's' : ''}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 6, margin: '8px 0' }}>
                  <Link to={`/products/${product._id}`} className="btn-buy" style={{ flex: 1, minWidth: 'auto', background: 'var(--slate-50)', color: 'var(--slate-700)', border: '1px solid var(--slate-200)', marginTop: 0 }}>
                    <Eye size={12} /> Details
                  </Link>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  <button className="btn-buy" style={{ flex: 1, minWidth: '100px', background: 'white', color: 'var(--teal-600)', border: '1px solid var(--teal-600)' }} onClick={() => addToCart(product)}>
                    🛒 Add to Cart
                  </button>
                  <button className="btn-buy" style={{ flex: 1, minWidth: '100px' }} onClick={() => handleBuy(product)}>
                    <Zap size={14} style={{ color: 'var(--teal-100)' }} />
                    Buy Now
                  </button>
                  {product.companyId && (
                    <button
                      className="btn-buy"
                      style={{ background: 'var(--slate-100)', color: 'var(--slate-700)', flex: 1, minWidth: '100px' }}
                      onClick={() => {
                        if (!token) { alert('Please login to request customisation.'); window.location.href = '/login'; return; }
                        setCustomizeModal(product);
                      }}
                    >
                      <Settings size={14} />
                      Customize
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
