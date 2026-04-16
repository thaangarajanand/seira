import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ShoppingBag, ShoppingCart, ShieldCheck, 
  Truck, Star, Bell, Zap, Package, Layers, Settings, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { API_BASE_URL as API } from '../api';

export default function UserHome() {
  const { user, token } = useAuth();
  const { cart } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(!!token);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Fetch products for featured section
    fetch(`${API}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFeaturedProducts(data.slice(0, 4));
        }
      })
      .catch(console.error);

    // Fetch orders to show stats
    if (token) {
      setLoading(true);
      fetch(`${API}/api/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setOrders(data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [token]);

  const activeOrders = orders.filter(o => !['completed', 'cancelled', 'rejected'].includes(o.status)).length;
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const categories = [
    { name: 'Precision Machining', icon: <Layers size={20} /> },
    { name: 'Industrial Automation', icon: <Zap size={20} /> },
    { name: 'Jigs & Fixtures', icon: <Settings size={20} /> },
    { name: 'Raw Materials', icon: <Package size={20} /> }
  ];

  return (
    <div className="user-home">
      {/* ── Personalized Hero ── */}
      <section className="hub-welcome">
        <div className="hub-badge pulse-amber">Customer Procurement Workspace</div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--slate-900)' }}>
          Welcome, <span className="gradient-text">{user?.name?.split(' ')[0] || 'Partner'}</span>.
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'var(--slate-600)', maxWidth: '600px', marginBottom: '24px' }}>
          Your industrial supply chain at a glance. Source parts, track manufacturing, 
          and manage your verified vendor relationships.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <div className="hub-stat-item shadow-sm">
            <div className="user-home-stat-icon" style={{ background: 'var(--teal-50)', color: 'var(--teal-600)' }}><Truck size={20} /></div>
            <div>
              <p className="user-home-stat-label">Active Orders</p>
              <p className="user-home-stat-value">{activeOrders}</p>
            </div>
          </div>
          <div className="hub-stat-item shadow-sm">
            <div className="user-home-stat-icon" style={{ background: 'var(--amber-50)', color: 'var(--amber-600)' }}><ShoppingCart size={20} /></div>
            <div>
              <p className="user-home-stat-label">Cart Items</p>
              <p className="user-home-stat-value">{cartItemCount}</p>
            </div>
          </div>
          <div className="hub-stat-item shadow-sm">
            <div className="user-home-stat-icon" style={{ background: 'var(--slate-100)', color: 'var(--slate-600)' }}><Bell size={20} /></div>
            <div>
              <p className="user-home-stat-label">Notifications</p>
              <p className="user-home-stat-value">0 New</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick Actions ── */}
      <section className="hub-section">
        <div className="hub-section-header">
          <h2 className="hub-section-title"><Zap size={20} color="var(--teal-600)" /> Quick Actions</h2>
        </div>
        <div className="user-home-grid" style={{ marginBottom: 0 }}>
          <Link to="/products" className="user-home-card glass">
            <div className="user-home-card-icon"><ShoppingBag size={24} /></div>
            <div>
              <h3>Source Products</h3>
              <p>Browse 100+ standard industrial components from verified factories.</p>
            </div>
            <span className="user-home-card-arrow"><ArrowRight size={20} /></span>
          </Link>
          <Link to="/dashboard" className="user-home-card glass">
            <div className="user-home-card-icon" style={{ background: 'var(--amber-50)', color: 'var(--amber-600)' }}><Package size={24} /></div>
            <div>
              <h3>Track Production</h3>
              <p>Monitor manufacturing progress and live GPS delivery status.</p>
            </div>
            <span className="user-home-card-arrow" style={{ color: 'var(--amber-600)' }}><ArrowRight size={20} /></span>
          </Link>
          <Link to="/cart" className="user-home-card glass">
            <div className="user-home-card-icon" style={{ background: 'var(--slate-100)', color: 'var(--slate-600)' }}><ShoppingCart size={24} /></div>
            <div>
              <h3>Finalize Checkout</h3>
              <p>Review your custom requirements and proceed with secure payment.</p>
            </div>
            <span className="user-home-card-arrow" style={{ color: 'var(--slate-600)' }}><ArrowRight size={20} /></span>
          </Link>
        </div>
      </section>

      {/* ── Featured Industrial Parts ── */}
      {!loading && featuredProducts.length > 0 && (
        <section className="hub-section">
          <div className="hub-section-header">
            <h2 className="hub-section-title"><Star size={20} color="var(--amber-500)" /> Featured Materials</h2>
            <Link to="/products" className="hub-section-link">View Full Catalog <ChevronRight size={16} /></Link>
          </div>
          <div className="featured-scroll">
            {featuredProducts.map(p => (
              <Link key={p._id} to={`/products/${p._id}`} className="mini-product-card">
                <img 
                  src={p.imageUrl?.startsWith('/uploads') ? `${API}${p.imageUrl}` : p.imageUrl || 'https://via.placeholder.com/300x150?text=Product'} 
                  alt={p.name} 
                  className="mini-product-img" 
                />
                <div className="mini-product-content">
                  <h3 className="mini-product-name">{p.name}</h3>
                  <p className="mini-product-price">₹{p.price.toLocaleString('en-IN')}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Category Scouting ── */}
      <section className="hub-section">
        <div className="hub-section-header">
          <h2 className="hub-section-title"><Layers size={20} color="var(--teal-600)" /> Browse by Category</h2>
        </div>
        <div className="category-grid">
          {categories.map(cat => (
            <Link key={cat.name} to={`/products`} className="category-card">
              <div className="category-icon-wrapper">{cat.icon}</div>
              <span className="category-label">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Protected Transactions ── */}
      <section className="user-home-trust hub-section" style={{ background: 'var(--slate-900)', borderRadius: '32px', padding: '40px', color: '#fff', marginTop: '64px' }}>
        <div style={{ wordBreak: 'break-word' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '12px' }}>India's Trusted Factory Network</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '24px', maxWidth: '400px' }}>
            Work with verified MSMEs and large factories. Every transaction is covered by our
            multi-stage escrow protection.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} color="var(--teal-400)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Secured Payments</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={20} color="var(--amber-400)" />
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Verified Vendors</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
          <ShieldCheck size={180} />
        </div>
      </section>
    </div>
  );
}

