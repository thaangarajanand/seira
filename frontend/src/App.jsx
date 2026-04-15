import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, Truck, UserCircle, LogOut, ChevronRight, Zap, Shield, Star, Clock, Award } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';

import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Login from './pages/Login';
import Cart from './pages/Cart';
import { useCart } from './context/CartContext';
import { Terms, Privacy, Refund } from './pages/Legal';
import ProductDetail from './pages/ProductDetail';
// ── Protected Route ────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

// ── Navbar ─────────────────────────────────────────────────
function Navbar() {
  const { isLoggedIn, logout, user } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <img src="/logo.jpeg" alt="SEIRA" className="brand-logo" style={{ height: '32px', borderRadius: '4px' }} />
          <span>SEIRA <span style={{ fontWeight: 400, opacity: 0.6, fontSize: '0.8em' }}>Industrial</span></span>
        </Link>

        <div className="navbar-links">
          <Link to="/products" className="nav-link">
            <ShoppingBag size={16} />
            Shop
          </Link>
          <Link to="/cart" className="nav-link cart-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ position: 'relative' }}>
              <ShoppingCart size={16} />
              {cart.length > 0 && <span className="cart-badge">{cart.reduce((a,c)=>a+c.quantity, 0)}</span>}
            </div>
            Cart
          </Link>
          <Link to="/dashboard" className="nav-link">
            <Home size={16} />
            Dashboard
          </Link>

          {isLoggedIn ? (
            <div className="nav-user">
              <span className="nav-username">
                {user?.name?.split(' ')[0]} ({user?.role === 'company' ? 'Company' : 'Customer'})
              </span>
              <button onClick={handleLogout} className="btn-logout">
                <LogOut size={15} />
                Logout
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-login">
              <UserCircle size={16} />
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── App ─────────────────────────────────────────────────────
function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/products" element={<Products />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cart" element={<Cart />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/logo.jpeg" alt="SEIRA" style={{ height: '32px', borderRadius: '4px', marginBottom: '8px' }} />
            <span>SEIRA</span>
            <p>India's trusted manufacturing marketplace</p>
          </div>
          <div className="footer-links">
            <Link to="/terms">Terms & Conditions</Link>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/refund">Refund Policy</Link>
          </div>
          <p className="footer-copy">© 2026 SEIRA Marketplace. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// ── Home View ───────────────────────────────────────────────
function HomeView() {
  const [topCompany, setTopCompany] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/auth/top-company')
      .then(res => res.json())
      .then(data => {
        if (data && data._id) setTopCompany(data);
      })
      .catch(() => {});
  }, []);

  const features = [
    {
      icon: <ShoppingBag size={28} />,
      title: 'Standard Catalog',
      desc: 'Browse 100+ industrial products from verified manufacturers. Instant Razorpay checkout.'
    },
    {
      icon: <Zap size={28} />,
      title: 'Custom Manufacturing',
      desc: 'Upload technical drawings. Set your rate & delivery date. Companies bid for your job.'
    },
    {
      icon: <Shield size={28} />,
      title: 'Price Negotiation',
      desc: 'Real-time negotiation with AI-assisted suggestions. Accept or counter any offer.'
    },
    {
      icon: <Star size={28} />,
      title: 'Verified Vendors',
      desc: 'Star ratings, portfolio, and order completion counts ensure you pick the best.'
    },
    {
      icon: <Clock size={28} />,
      title: 'Live Tracking',
      desc: 'Real-time GPS location tracking from dispatch to doorstep. Know where your order is.'
    },
    {
      icon: <UserCircle size={28} />,
      title: 'Secure Payments',
      desc: 'Razorpay-powered payments. Money is only released after you confirm delivery.'
    }
  ];

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">🚀 India's #1 Manufacturing Marketplace</div>
        <h1 className="hero-title">
          Manufacturing Meets
          <span className="gradient-text"> AI</span>
        </h1>
        <p className="hero-sub">
          Order standard industrial products or upload custom drawings to negotiate exact rates
          and delivery terms with top-tier verified vendors — all in real time.
        </p>
        <div className="hero-actions">
          <Link to="/products" className="btn-primary">
            Browse Catalog <ChevronRight size={18} />
          </Link>

        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-num">Quality</span>
            <span className="stat-label">Products</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">Trusted</span>
            <span className="stat-label">Vendors</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">Highly</span>
            <span className="stat-label">Rated</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">Secure</span>
            <span className="stat-label">Payments</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-header">
          <h2>Everything You Need</h2>
          <p>From standard parts to complex custom manufacturing — we handle it all.</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Top Vendors Section */}
      {topCompany && (
        <section className="features-section" style={{ background: 'var(--teal-50)', padding: '60px 20px' }}>
          <div className="section-header">
            <h2 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Award size={32} color="var(--amber-500)" />
              Top Rated Vendor
            </h2>
            <p>We connect you directly to India's best manufacturing companies.</p>
          </div>
          <div style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: 8 }}>{topCompany.companyName}</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16 }}>
              <span style={{ background: 'var(--amber-100)', color: 'var(--amber-700)', padding: '4px 12px', borderRadius: 20, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={14} /> {topCompany.averageRating > 0 ? topCompany.averageRating : '5.0'} Rating
              </span>
              <span style={{ background: 'var(--teal-100)', color: 'var(--teal-700)', padding: '4px 12px', borderRadius: 20, fontWeight: 'bold' }}>
                ✓ {topCompany.completedOrdersCount} Orders Completed
              </span>
            </div>
            <p style={{ color: 'var(--slate-600)', marginBottom: 20 }}>
              {topCompany.companyName} is highly recommended by {topCompany.completedOrdersCount} clients for their excellent quality and prompt delivery. You can assign custom orders directly to them during checkout!
            </p>
            <Link to="/products" className="btn-primary" style={{ display: 'inline-flex', margin: '0 auto' }}>
              Browse Catalog
            </Link>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to manufacture smarter?</h2>
          <p>Join thousands of engineers and procurement teams who trust SEIRA.</p>
          <div className="hero-actions">
            <Link to="/login" className="btn-primary">
              Get Started Free <ChevronRight size={18} />
            </Link>
            <Link to="/products" className="btn-secondary">
              Browse Products
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
