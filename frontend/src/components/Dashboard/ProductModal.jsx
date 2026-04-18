import React, { useState, useEffect } from 'react';
import { X, Upload, Loader2, Package, IndianRupee, Layers } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, product, onSave, API }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: 1,
    imageUrl: ''
  });
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price || '',
        stock: product.stock || 0,
        imageUrl: product.imageUrl || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: '',
        price: '',
        stock: 1,
        imageUrl: ''
      });
    }
  }, [product, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    const data = new FormData();
    data.append('drawings', file); // API expects 'drawings' field name for uploads

    try {
      const res = await fetch(`${API}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: data
      });
      const result = await res.json();
      if (res.ok) {
        setFormData(prev => ({ ...prev, imageUrl: result.urls[0] }));
      } else {
        alert(result.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSave(formData, product?._id);
    setLoading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal" style={{ maxWidth: 500, width: '90%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{product ? 'Edit Industrial Part' : 'List New Industrial Part'}</h2>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={14} /> Product Name
            </label>
            <input 
              name="name" 
              className="form-input" 
              required 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="e.g. Precision CNC Gear"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={14} /> Category
              </label>
              <input 
                name="category" 
                className="form-input" 
                required 
                value={formData.category} 
                onChange={handleChange} 
                placeholder="e.g. Machinery"
              />
            </div>
            <div>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                Stock Count
              </label>
              <input 
                name="stock" 
                type="number" 
                className="form-input" 
                min="0"
                required 
                value={formData.stock} 
                onChange={handleChange} 
              />
            </div>
          </div>

          <div>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IndianRupee size={14} /> Unit Price (₹)
            </label>
            <input 
              name="price" 
              type="number" 
              className="form-input" 
              required 
              value={formData.price} 
              onChange={handleChange} 
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="form-label">Part Description & Technical Specs</label>
            <textarea 
              name="description" 
              className="form-input" 
              rows={3} 
              value={formData.description} 
              onChange={handleChange} 
              placeholder="Material grade, tolerance, finishes..."
            />
          </div>

          <div>
            <label className="form-label">Product Image</label>
            <div 
              onClick={() => document.getElementById('product-img-upload').click()}
              style={{ 
                border: '2px dashed var(--slate-200)', 
                borderRadius: 12, 
                padding: 20, 
                textAlign: 'center', 
                cursor: 'pointer',
                background: formData.imageUrl ? `url(${formData.imageUrl.startsWith('/uploads') ? API + formData.imageUrl : formData.imageUrl}) center/cover no-repeat` : 'var(--slate-50)',
                height: 120,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {!formData.imageUrl && !uploading && (
                <>
                  <Upload size={24} style={{ color: 'var(--slate-400)', marginBottom: 8 }} />
                  <span style={{ fontSize: '.8rem', color: 'var(--slate-500)' }}>Click to upload JPG/PNG</span>
                </>
              )}
              {uploading && <Loader2 size={24} className="spin" style={{ color: 'var(--teal-600)' }} />}
              {formData.imageUrl && !uploading && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <span style={{ color: '#fff', fontSize: '.8rem', fontWeight: 700 }}>Change Image</span>
                </div>
              )}
            </div>
            <input id="product-img-upload" type="file" hidden accept="image/*" onChange={handleImageUpload} />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading || uploading} 
            style={{ width: '100%', justifyContent: 'center', padding: 14, marginTop: 10 }}
          >
            {loading ? 'Saving...' : product ? 'Update Product' : 'List Product'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
