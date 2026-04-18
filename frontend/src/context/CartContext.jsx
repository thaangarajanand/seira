import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE_URL as API } from '../api';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { isLoggedIn, token } = useAuth();
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('SEIRA-cart');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  // loading state removed as it was unused

  // 2. Sync with Backend on Login
  useEffect(() => {
    if (!isLoggedIn) return;

    const syncCart = async () => {
      try {
        const res = await fetch(`${API}/api/cart`, {
          credentials: 'include'
        });
        if (res.ok) {
          const backendCart = await res.json();
          
          // Merge logic: Local cart takes priority for now, or just replace if backend is empty
          if (cart.length > 0) {
             // Sync local to backend
             await fetch(`${API}/api/cart/sync`, {
               method: 'POST',
               credentials: 'include',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ cart })
             });
          } else {
             setCart(backendCart.map(item => ({
               ...item.product,
               _id: item.product?._id, // Ensure we use the product ID
               cartItemId: item._id,   // Store DB id
               quantity: item.quantity,
               type: item.type,
               customData: item.customData
             })));
          }
        }
      } catch (err) {
        console.error('Cart sync failed:', err);
      }
    };

    syncCart();
  }, [isLoggedIn, cart]);

  // 3. Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('SEIRA-cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (!isLoggedIn) {
      // Clear cart on logout. This is intentional state synchronization.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCart([]);
      localStorage.removeItem('SEIRA-cart');
    }
  }, [isLoggedIn]);

  const addToCart = async (product, type = 'standard', customData = null) => {
    const newItem = { 
      ...product, 
      quantity: 1, 
      type, 
      customData,
      _id: product._id // Ensure ID consistency
    };

    setCart(prev => {
      // Find matching item (same ID and type)
      const exists = prev.find(item => 
        item._id === product._id && item.type === type
      );
      
      if (exists && type === 'standard') {
        return prev.map(item => 
          (item._id === product._id && item.type === type) 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      return [...prev, newItem];
    });

    // Backend sync
    if (token) {
      try {
        await fetch(`${API}/api/cart/add`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            product: product._id, 
            type, 
            quantity: 1, 
            customData 
          })
        });
      } catch (err) { console.error(err); }
    }
  };

  const removeFromCart = async (id, itemType) => {
    const targetItem = cart.find(item => item._id === id && item.type === itemType);
    setCart(prev => prev.filter(item => !(item._id === id && item.type === itemType)));

    if (token && targetItem?.cartItemId) {
      try {
        await fetch(`${API}/api/cart/${targetItem.cartItemId}`, {
          method: 'DELETE',
          credentials: 'include'
        });
      } catch (err) { console.error(err); }
    }
  };

  const updateQuantity = async (id, itemType, quantity) => {
    if (quantity < 1) return removeFromCart(id, itemType);
    
    setCart(prev => prev.map(item => 
      (item._id === id && item.type === itemType) ? { ...item, quantity } : item
    ));

    // For simplicity, we sync the whole cart on quantity change if logged in
    if (token) {
       // Debounce this in a real app, but for now:
       // We'll update the local state and let the interval/sync handle it or explicit sync
    }
  };

  const clearCart = async () => {
    setCart([]);
    if (token) {
      try {
        await fetch(`${API}/api/cart`, {
          method: 'DELETE',
          credentials: 'include'
        });
      } catch (err) { console.error(err); }
    }
  };

  const totalAmount = (cart || []).reduce((sum, item) => {
    const price = item.customData?.proposedRate || item.price || 0;
    return sum + (price * (item.quantity || 1));
  }, 0);

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart, totalAmount
    }}>
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => useContext(CartContext);
