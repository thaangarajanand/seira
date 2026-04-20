import React from 'react';
import { Package, Settings, BarChart2, UserCircle, Shield, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardSidebar = ({ view, setView, isCompany, user, isSidebarOpen, setIsSidebarOpen }) => {
  return (
    <>
      <aside className={`dashboard-sidebar ${isSidebarOpen ? 'open' : ''}`} style={{ borderRight: '1px solid var(--slate-200)', flexShrink: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '24px 0', position: 'sticky', top: 88 }}>
          <button 
            className={`nav-link ${view === 'orders' ? 'active' : ''}`} 
            onClick={() => { setView('orders'); setIsSidebarOpen(false); }}
            style={view === 'orders' ? { background: 'var(--teal-50)', color: 'var(--teal-700)', fontWeight: 700 } : {}}
          >
            <Package size={18} /> My Orders
          </button>
          
          {isCompany && (
            <>
              <button 
                className={`nav-link ${view === 'products' ? 'active' : ''}`} 
                onClick={() => { setView('products'); setIsSidebarOpen(false); }}
                style={view === 'products' ? { background: 'var(--teal-50)', color: 'var(--teal-700)', fontWeight: 700 } : {}}
              >
                <Settings size={18} /> Inventory Management
              </button>
              <button 
                className={`nav-link ${view === 'analytics' ? 'active' : ''}`} 
                onClick={() => { setView('analytics'); setIsSidebarOpen(false); }}
                style={view === 'analytics' ? { background: 'var(--teal-50)', color: 'var(--teal-700)', fontWeight: 700 } : {}}
              >
                <BarChart2 size={18} /> Financial Ledger
              </button>
            </>
          )}

          <button 
            className={`nav-link ${view === 'profile' ? 'active' : ''}`} 
            onClick={() => { setView('profile'); setIsSidebarOpen(false); }}
            style={view === 'profile' ? { background: 'var(--teal-50)', color: 'var(--teal-700)', fontWeight: 700 } : {}}
          >
            <UserCircle size={18} /> Profile & Reviews
          </button>

          {user?.role === 'admin' && (
            <button 
              className={`nav-link ${view === 'admin' ? 'active' : ''}`} 
              onClick={() => { setView('admin'); setIsSidebarOpen(false); }}
              style={view === 'admin' ? { background: 'var(--teal-50)', color: 'var(--teal-700)', fontWeight: 700 } : {}}
            >
              <Shield size={18} /> Master Governance
            </button>
          )}

          <div style={{ marginTop: 'auto', borderTop: '1px solid var(--slate-100)', paddingTop: 16 }}>
             <Link to="/products" className="nav-link" style={{ color: 'var(--teal-600)' }}>
                <ShoppingBag size={18} /> Visit Marketplace
             </Link>
          </div>
        </div>
      </aside>
      
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1050 }} 
        />
      )}
    </>
  );
};

export default DashboardSidebar;
