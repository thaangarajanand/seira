import { useCart } from '../context/CartContext';
import { X, Trash2, Plus, Minus, CreditCard } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL as API } from '../api';

export default function CartDrawer() {
  const { cart, removeFromCart, updateQuantity, totalAmount, isCartOpen, setIsCartOpen, clearCart } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    if (!isLoggedIn) {
      alert('Please login to checkout.');
      setIsCartOpen(false);
      navigate('/login');
      return;
    }
    if (cart.length === 0) return;
    
    // We create an order for each cart item
    setLoading(true);
    try {
      const orderIds = [];
      for (const item of cart) {
        const res = await fetch(`${API}/api/orders`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'standard', product: item._id, proposedRate: item.price, quantity: item.quantity })
        });
        if (!res.ok) throw new Error('Failed to create order');
        const order = await res.json();
        orderIds.push({ orderId: order._id, amount: item.price * item.quantity });
      }

      // Total amount checkout - Razorpay integration
      const total = orderIds.reduce((sum, item) => sum + item.amount, 0);
      
      const payRes = await fetch(`${API}/api/payment/create-order`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total })
      });
      if (!payRes.ok) throw new Error('Payment init failed');
      const payOrder = await payRes.json();
      
      const payConfigRes = await fetch(`${API}/api/payment/config`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const payConfig = await payConfigRes.json();

      if (payOrder.mock || payConfig.mock) {
        // Just verify automatically for mock
        await Promise.all(orderIds.map(o => fetch(`${API}/api/payment/verify`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mock: true, orderId: o.orderId })
        })));
        clearCart();
        setIsCartOpen(false);
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
            await Promise.all(orderIds.map(o => fetch(`${API}/api/payment/verify`, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...response, orderId: o.orderId })
            })));
            clearCart();
            setIsCartOpen(false);
            alert('✅ Payment Successful!');
            navigate('/dashboard');
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
    <div className="cart-overlay" onClick={() => setIsCartOpen(false)}>
      <div className="cart-drawer" onClick={e => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Your Cart ({cart.length})</h2>
          <button onClick={() => setIsCartOpen(false)}><X size={20} /></button>
        </div>
        
        <div className="cart-items">
          {cart.length === 0 ? (
            <p className="empty-cart">Your cart is empty</p>
          ) : (
            cart.map(item => (
              <div key={item._id} className="cart-item">
                <img src={item.imageUrl} alt={item.name} className="cart-item-img" />
                <div className="cart-item-details">
                  <h4>{item.name}</h4>
                  <p>₹{item.price.toLocaleString('en-IN')}</p>
                  <div className="cart-qty">
                    <button onClick={() => updateQuantity(item._id, item.quantity - 1)}><Minus size={14}/></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item._id, item.quantity + 1)}><Plus size={14}/></button>
                  </div>
                </div>
                <button className="cart-remove" onClick={() => removeFromCart(item._id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total</span>
              <span>₹{totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <button className="btn-primary" style={{width: '100%'}} onClick={handleCheckout} disabled={loading}>
              <CreditCard size={18} />
              {loading ? 'Processing...' : 'Checkout Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
