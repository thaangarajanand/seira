import React from 'react';
import { UserCircle, Shield, ShieldAlert, Truck, Package, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react';

const AdminPanel = ({ stats, allUsers, pendingCompanies, page, setPage, handleSuspendUser, handleViewUserDetails, approveCompany }) => {
  return (
    <div className="admin-panel-shell" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Platform Stats Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { label: 'Total Users', value: stats.users, icon: <UserCircle size={20} /> },
          { label: 'Active Companies', value: stats.companies, icon: <Truck size={20} /> },
          { label: 'Total Orders', value: stats.orders, icon: <Package size={20} /> },
          { label: 'Platform Revenue (₹)', value: stats.revenue, icon: <CreditCard size={20} /> }
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--teal-600)', marginBottom: 8, display: 'flex', justifyContent: 'center' }}>{s.icon}</div>
            <p style={{ fontSize: '1.25rem', fontWeight: 800 }}>{s.value.toLocaleString()}</p>
            <p style={{ fontSize: '.75rem', color: 'var(--slate-500)', textTransform: 'uppercase' }}>{s.label}</p>
          </div>
        ))}
      </div>


      {/* User Governance & List */}
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Platform User Management</h3>
        <div className="admin-user-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(allUsers.users || []).map(u => (
            <div key={u._id} className="admin-user-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: u.isSuspended ? '#fef2f2' : 'var(--slate-50)', borderRadius: 12, border: u.isSuspended ? '1px solid #fecaca' : '1px solid var(--slate-200)' }}>
              <div className="admin-user-main" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--slate-200)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCircle size={24} color="var(--slate-400)" />
                </div>
                <div className="admin-user-copy">
                  <p className="admin-user-title" style={{ fontWeight: 800, color: 'var(--slate-900)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {u.name} {u.role === 'admin' && <Shield size={14} color="var(--teal-600)" />}
                    {u.isSuspended && <span style={{ fontSize: '.6rem', background: 'var(--red-500)', color: '#fff', padding: '1px 6px', borderRadius: 4 }}>SUSPENDED</span>}
                  </p>
                  <p style={{ fontSize: '.8rem', color: 'var(--slate-500)', margin: 0 }}>{u.email} • {u.role.toUpperCase()}</p>
                </div>
              </div>
              <div className="admin-user-actions" style={{ display: 'flex', gap: 8 }}>
                {u.role !== 'admin' && (
                  <button 
                    className={u.isSuspended ? 'btn-primary' : 'btn-reject'} 
                    style={{ padding: '6px 12px', fontSize: '.75rem', background: u.isSuspended ? 'var(--green-500)' : 'var(--red-500)', color: '#fff' }} 
                    onClick={() => handleSuspendUser(u._id, !u.isSuspended)}
                  >
                    {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                )}
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '.75rem' }} onClick={() => handleViewUserDetails(u)}>Details</button>
              </div>
            </div>
          ))}
        </div>
        
        {allUsers.pages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={16}/></button>
            {[...Array(allUsers.pages)].map((_, i) => (
              <button key={i} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
            <button className="page-btn" disabled={page === allUsers.pages} onClick={() => setPage(p => p + 1)}><ChevronRight size={16}/></button>
          </div>
        )}
      </div>

      {/* Corporate Approvals */}
      <div className="card">
        <h3 style={{ marginBottom: 16 }}>Corporate Profile Verification</h3>
        {pendingCompanies.companies?.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--slate-400)', padding: 40 }}>All corporate profiles are verified.</p>
        ) : (
          <div className="admin-company-list" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pendingCompanies.companies?.map(c => (
              <div key={c._id} className="admin-company-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: 'var(--slate-50)', borderRadius: 12, border: '1px solid var(--slate-200)' }}>
                <div>
                  <p style={{ fontWeight: 800, color: 'var(--slate-900)' }}>{c.companyName || c.name}</p>
                  <p style={{ fontSize: '.8rem', color: 'var(--slate-500)' }}>{c.email}</p>
                </div>
                <div className="admin-company-actions" style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-primary" style={{ padding: '6px 16px', fontSize: '.8rem' }} onClick={() => approveCompany(c._id)}>Verify Now</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
