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
import UserHome from './pages/UserHome';
import { API_BASE_URL } from './api';

// ── Protected Route ────────────────────────────────────────
function ProtectedRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  return children;
}

function CustomerRoute({ children }) {
  const { isLoggedIn, loading, user } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (user?.role !== 'customer') return <Navigate to="/dashboard" replace />;
  return children;
}

// ── Navbar ─────────────────────────────────────────────────
function Navbar() {
  const { isLoggedIn, logout, user } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const homeLink = isLoggedIn && user?.role === 'customer' ? '/user-home' : '/';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to={homeLink} className="navbar-brand">
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
          {isLoggedIn && user?.role === 'customer' && (
            <Link to="/user-home" className="nav-link">
              <UserCircle size={16} />
              Home
            </Link>
          )}

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
          <Route path="/user-home" element={
            <CustomerRoute><UserHome /></CustomerRoute>
          } />

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
  const { isLoggedIn, isCompany, user } = useAuth();

  if (isLoggedIn && user?.role === 'customer') {
    return <UserHome />;
  }

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/top-company`)
      .then(res => res.json())
      .then(data => {
        if (data && data._id) setTopCompany(data);
      })
      .catch(() => {});
  }, []);

  const features = [
    {
      icon: <ShoppingBag size={28} />,
      title: 'Industrial Catalog',
      desc: 'Source 100+ standard industrial products from verified manufacturers with ease.'
    },
    {
      icon: <Zap size={28} />,
      title: 'Custom Manufacturing',
      desc: 'Upload drawings, specify material needs, and let vendors compete for your project.'
    },
    {
      icon: <Shield size={28} />,
      title: 'Secure Procurement',
      desc: 'Multi-stage payment protection. Money is only released upon your delivery confirmation.'
    },
    {
      icon: <Star size={28} />,
      title: 'Verified Partners',
      desc: 'Detailed vendor portfolios, ratings, and order history help you pick the right factory.'
    },
    {
      icon: <Clock size={28} />,
      title: 'Visual Tracking',
      desc: 'Watch your order move from the factory floor to your doorstep with live GPS tracking.'
    },
    {
      icon: <Award size={28} />,
      title: 'Quality Guaranteed',
      desc: 'Standardized quality checks and community reviews ensure industrial-grade excellence.'
    }
  ];

  return (
    <div className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">🏭 India's Premier Industrial B2B Marketplace</div>
        <h1 className="hero-title">
          Scale Your Production
          <span className="gradient-text"> Faster</span>
        </h1>
        <p className="hero-sub">
          The smart way for procurement teams to source standard parts or commission custom 
          manufacturing. Negotiate directly with verified vendors in real-time.
        </p>
        <div className="hero-actions" style={{ justifyContent: 'center' }}>
          <Link to="/products" className="btn-primary">
            Browse All Products <ChevronRight size={18} />
          </Link>
          
          {isCompany ? (
             <Link to="/dashboard" className="btn-secondary">
               Go to Manufacturer Dashboard
             </Link>
          ) : (
             !isLoggedIn && (
               <Link to="/login" className="btn-secondary">
                 Manufacturer? Start Selling
               </Link>
             )
          )}
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-num">Precision</span>
            <span className="stat-label">Engineering</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">Verified</span>
            <span className="stat-label">Factories</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">Real-time</span>
            <span className="stat-label">Negotiation</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-num">Secure</span>
            <span className="stat-label">Logistics</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-header">
          <h2>Streamlined Industrial Sourcing</h2>
          <p>Everything you need to manage your manufacturing supply chain in one place.</p>
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
              Sourcing Spotlight
            </h2>
            <p>Connect with our highest-rated manufacturing partners.</p>
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
              {topCompany.companyName} is recognized for precision and reliability. Procurement teams trust them for both standard parts and complex custom manufacturing projects.
            </p>
            <Link to="/products" className="btn-primary" style={{ display: 'inline-flex', margin: '0 auto' }}>
              View Catalog
            </Link>
          </div>
        </section>
      )}

      {/* CTA Banner */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to revolutionize your production?</h2>
          <p>Join India's most advanced industrial marketplace today.</p>
          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <Link to="/login" className="btn-primary">
              Get Started for Free <ChevronRight size={18} />
            </Link>
            <Link to="/products" className="btn-secondary">
              Explore Marketplace
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default App;
