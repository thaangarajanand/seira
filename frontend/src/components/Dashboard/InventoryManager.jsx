import React from 'react';
import { Package, Plus } from 'lucide-react';

const InventoryManager = ({ myProducts, openProductModal, deleteProduct, API }) => {
  return (
    <div className="product-grid" style={{ gridColumn: 'span 2' }}>
      {myProducts.length === 0 ? (
        <div className="empty-state-v2">
          <div className="empty-state-icon"><Package size={24}/></div>
          <p>No industrial products found in your inventory.</p>
          <button className="btn-primary" style={{ marginTop: 12 }} onClick={()=>openProductModal('add')}>+ List Your First Product</button>
        </div>
      ) : myProducts.map(p => (
        <div key={p._id} className="card product-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {!p.isApproved && (
            <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 5, background: 'var(--amber-400)', color: '#000', fontSize: '.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: 4, boxShadow: 'var(--shadow-sm)' }}>UNDER REVIEW</div>
          )}
          <img 
            src={p.imageUrl?.startsWith('/uploads') ? `${API}${p.imageUrl}` : p.imageUrl} 
            alt={p.name} 
            className="product-img" 
            style={{ height: 160, objectFit: 'cover', borderRadius: '8px 8px 0 0' }} 
          />
          <div className="product-body" style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <p style={{ fontSize: '.7rem', color: 'var(--slate-400)', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>{p.category}</p>
              <p style={{ fontSize: '.75rem', fontWeight: 700, color: p.stock > 0 ? 'var(--teal-600)' : 'var(--red-500)', margin: 0 }}>Stock: {p.stock || 0}</p>
            </div>
            <h3 className="product-name" style={{ fontSize: '1rem', fontWeight: 700, margin: '4px 0' }}>{p.name}</h3>
            <p className="product-price" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--teal-600)', margin: 0 }}>₹{p.price?.toLocaleString('en-IN')}</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 16 }}>
              <button className="btn-secondary" style={{ flex: 1, padding: '7px 0', fontSize: '.75rem' }} onClick={()=>openProductModal('edit', p)}>Edit</button>
              <button className="btn-reject" style={{ flex: 1, padding: '7px 0', fontSize: '.75rem', color: 'var(--red-500)' }} onClick={()=>deleteProduct(p._id)}>Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default InventoryManager;
