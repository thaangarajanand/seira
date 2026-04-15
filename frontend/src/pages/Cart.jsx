import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, CreditCard, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const API = 'http://localhost:5000';

export default function Cart() {
  const { cart, removeFromCart, updateQuantity, totalAmount, clearCart } = useCart();
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [payConfig, setPayConfig] = useState({ mock: true });

  useEffect(() => {
    fetch(`${API}/api/payment/config`).then(r => r.json()).then(setPayConfig).catch(() => {});
  }, []);

  const handleCheckout = async () => {
    if (!token) {
      alert('Please login to checkout.');
      navigate('/login');
      return;
    }
    if (cart.length === 0) return;

    if (!user?.address || !user?.location) {
      alert('📍 Please update your delivery address and location in your profile before checking out.');
      navigate('/dashboard');
      return;
    }
    
    // We create an order for each cart item
    setLoading(true);
    try {
      const orderIds = [];
      for (const item of cart) {
        const payload = {
          type: item.type || 'standard',
          product: item._id,
          proposedRate: item.type === 'custom' ? item.customData?.proposedRate : (item.price || 0),
          quantity: item.quantity || 1
        };

        if (item.type === 'custom') {
          payload.drawings = item.customData?.drawings;
          payload.description = item.customData?.description;
          payload.dimensions = item.customData?.dimensions;
          payload.proposedDeliveryDate = item.customData?.proposedDeliveryDate;
        }

        const res = await fetch(`${API}/api/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to create order');
        const order = await res.json();
        orderIds.push({ orderId: order._id });
      }

      // Total amount checkout - Razorpay integration
      const total = Array.isArray(cart) ? cart.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0) : 0;
      
      const payRes = await fetch(`${API}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: total })
      });
      if (!payRes.ok) throw new Error('Payment init failed');
      const payOrder = await payRes.json();
      
      const pConfigRes = await fetch(`${API}/api/payment/config`);
      const pConfig = await pConfigRes.json();

      if (payOrder.mock || pConfig.mock) {
        // Just verify automatically for mock
        const verifyRes = await fetch(`${API}/api/payment/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            mock: true, 
             orderIds: orderIds.map(o => o.orderId),
             razorpay_payment_id: 'mock_cart_' + Date.now()
          })
        });
        if (!verifyRes.ok) throw new Error('Bulk verification failed');
        
        clearCart();
        alert('Payment successful! View your dashboard.');
        navigate('/dashboard');
      } else {
        const options = {
          key: payConfig.keyId,
          amount: payOrder.amount,
          currency: payOrder.currency,
          name: 'SEIRA Marketplace',
          description: `Checkout ${cart.length} items`,
          order_id: payOrder.id,
          handler: async (response) => {
            const verifyRes = await fetch(`${API}/api/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ 
                ...response, 
                orderIds: orderIds.map(o => o.orderId) 
              })
            });
            if (verifyRes.ok) {
              clearCart();
              alert('✅ Payment Successful!');
              navigate('/dashboard');
            } else {
              alert('❌ Payment verification failed. Please contact support.');
            }
          },
          theme: { color: '#0D9488' }
        };
        new window.Razorpay(options).open();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-page" style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 30 }}>
        <Link to="/products" className="btn-secondary" style={{ padding: '8px', display: 'flex' }}>
          <ArrowLeft size={18} />
        </Link>
        <h1 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShoppingBag size={28} color="var(--teal-600)" />
          Your Cart
        </h1>
      </div>
      
      <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid var(--slate-100)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', padding: '24px' }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--slate-400)' }}>
            <ShoppingBag size={48} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <p style={{ fontSize: '1.1rem', marginBottom: 20 }}>Your cart is empty.</p>
            <Link to="/products" className="btn-primary" style={{ display: 'inline-flex' }}>Browse Products</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {cart.map(item => (
              <div key={item._id} style={{ display: 'flex', gap: 20, alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid var(--slate-100)' }}>
                <Link to={`/products/${item._id}`}>
                  <img src={item.imageUrl?.startsWith('/uploads') ? `${API}${item.imageUrl}` : item.imageUrl} alt={item.name} style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8, background: 'var(--slate-50)' }} />
                </Link>
                
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <h4 style={{ fontSize: '1.2rem', margin: 0 }}>{item.name}</h4>
                    <span style={{ fontSize: '.7rem', padding: '2px 8px', borderRadius: 4, background: item.type === 'custom' ? 'var(--amber-100)' : 'var(--slate-100)', color: item.type === 'custom' ? 'var(--amber-700)' : 'var(--slate-600)', fontWeight: 700, textTransform: 'uppercase' }}>
                      {item.type || 'standard'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--slate-500)', fontSize: '.9rem', marginBottom: 8 }}>
                    ₹{(item.type === 'custom' ? (item.customData?.proposedRate ?? 0) : (item.price ?? 0)).toLocaleString('en-IN')}
                  </p>

                  {item.type === 'custom' && (
                    <div style={{ marginBottom: 12, padding: 8, background: 'var(--amber-50)', borderRadius: 8, border: '1px solid var(--amber-100)', fontSize: '.8rem' }}>
                      <p style={{ margin: '0 0 4px 0' }}><strong>Requirements:</strong> {item.customData?.description}</p>
                      {item.customData?.dimensions && <p style={{ margin: '0 0 4px 0' }}><strong>Size:</strong> {item.customData?.dimensions}</p>}
                      {item.customData?.drawings?.length > 0 && (
                        <p style={{ margin: 0, color: 'var(--teal-600)', fontWeight: 600 }}>📎 {item.customData.drawings.length} Drawings Attached</p>
                      )}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--slate-200)', borderRadius: 6, overflow: 'hidden' }}>
                      <button onClick={() => updateQuantity(item._id, item.type, item.quantity - 1)} style={{ padding: '6px 10px', background: 'var(--slate-50)', border: 'none', cursor: 'pointer' }}><Minus size={14}/></button>
                      <span style={{ padding: '0 12px', minWidth: 30, textAlign: 'center', fontSize: '.9rem', fontWeight: 600 }}>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item._id, item.type, item.quantity + 1)} style={{ padding: '6px 10px', background: 'var(--slate-50)', border: 'none', cursor: 'pointer' }}><Plus size={14}/></button>
                    </div>
                    
                    <button onClick={() => removeFromCart(item._id, item.type)} style={{ color: 'var(--red-500)', background: 'var(--red-50)', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: '.85rem' }}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                  ₹{((item.type === 'custom' ? item.customData?.proposedRate : (item.price || 0)) * (item.quantity || 1)).toLocaleString('en-IN')}
                </div>
              </div>
            ))}

            <div style={{ marginTop: 20, padding: 24, background: 'var(--slate-50)', borderRadius: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <span style={{ fontSize: '1.2rem', color: 'var(--slate-600)' }}>Total Checkout Amount</span>
                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--teal-700)' }}>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>
              <button 
                className="btn-primary" 
                style={{ 
                  width: '100%', 
                  padding: '16px', 
                  fontSize: '1.1rem', 
                  justifyContent: 'center', 
                  background: 'linear-gradient(135deg, var(--teal-600), var(--teal-700))' 
                }} 
                onClick={() => {
                  if (!window.Razorpay && !payConfig.mock) {
                    alert('Razorpay SDK failed to load. Please check your internet connection.');
                    return;
                  }
                  handleCheckout();
                }} 
                disabled={loading}
              >
                <CreditCard size={20} />
                {loading ? 'Processing Checkout...' : 'Secure Checkout with Razorpay'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '.75rem', color: 'var(--slate-400)', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Shield size={12} /> SSL Secure & Encrypted Payments
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
