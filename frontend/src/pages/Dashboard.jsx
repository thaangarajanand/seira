import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Zap, Filter, ShieldAlert, MapPin, Package, ShoppingBag
} from 'lucide-react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

// Modular Dashboard Components
import DashboardSidebar from '../components/Dashboard/DashboardSidebar';
import AdminPanel from '../components/Dashboard/AdminPanel';
import AnalyticsView from '../components/Dashboard/AnalyticsView';
import ProfileSection from '../components/Dashboard/ProfileSection';
import InventoryManager from '../components/Dashboard/InventoryManager';
import OrderCard from '../components/Dashboard/OrderCard';
import ChatPanel from '../components/Dashboard/ChatPanel';
import { MockPayModal, ReviewModal, UserDetailsModal } from '../components/Dashboard/DashboardModals';
import ProductModal from '../components/Dashboard/ProductModal';
import { API_BASE_URL as API } from '../api';

export default function Dashboard() {
  const { user, isCompany } = useAuth();
  
  // Navigation State
  const [view, setView] = useState('orders'); // orders, products, profile, admin, analytics
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data States
  const [orders, setOrders] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [stats, setStats] = useState({ users: 0, companies: 0, orders: 0, revenue: 0, gmvTrend: [] });
  const [pendingCompanies, setPendingCompanies] = useState({ companies: [], pages: 1, total: 0 });
  const [allUsers, setAllUsers] = useState({ users: [], pages: 1, total: 0 });
  const [myReviews] = useState([]);
  const [page, setPage] = useState(1);

  // Chat/Interaction States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [chatLang, setChatLang] = useState('en');

  // Modal States
  const [payModal, setPayModal] = useState(null);
  const [showReview, setShowReview] = useState(null);
  const [productModal, setProductModal] = useState({ isOpen: false, product: null });
  const [selectedUserDetails, setSelectedUserDetails] = useState(null);

  
  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  // Form States
  const [proposedRates, setProposedRates] = useState({});
  const [proposedDates, setProposedDates] = useState({});
  const [counterNotes, setCounterNotes] = useState({});
  const [otpInputs, setOtpInputs] = useState({});

  // ── Data Fetching ──────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/orders`, {
        credentials: 'include'
      });
      if (res.ok) setOrders(await res.json());
    } catch (err) { console.error('Action failed:', err); }
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!isCompany) return;
    try {
      const res = await fetch(`${API}/api/products/my-products`, {
        credentials: 'include'
      });
      if (res.ok) setMyProducts(await res.json());
    } catch (err) { console.error('Action failed:', err); }
  }, [isCompany]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/admin/stats`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) { console.error('Action failed:', err); }
  }, []);

  const fetchAdminData = useCallback(async () => {
    if (user?.role !== 'admin' && view !== 'admin') return;
    try {
       const userRes = await fetch(`${API}/api/admin/users?page=${page}`, { credentials: 'include' });
       const compRes = await fetch(`${API}/api/admin/pending-companies`, { credentials: 'include' });
       
       if (userRes.ok) setAllUsers(await userRes.json());
       if (compRes.ok) setPendingCompanies(await compRes.json());
    } catch (err) { console.error('Action failed:', err); }
  }, [page, user, view]);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchOrders(), fetchProducts(), fetchStats()]);
      setLoading(false);
    };
    init();
  }, [fetchOrders, fetchProducts, fetchStats]);

  useEffect(() => {
    if (view === 'admin') {
      const loadAdminData = async () => {
        await Promise.all([fetchAdminData(), fetchStats()]);
      };
      loadAdminData();
    }
  }, [view, fetchAdminData]);

  // ── Socket Logic ──────────────────────────────────────
  useEffect(() => {
    const socket = io(API);
    socketRef.current = socket;
    
    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    socket.on('order_status_updated', () => fetchOrders());

    return () => socket.disconnect();
  }, [fetchOrders]);

  // ── Handlers ──────────────────────────────────────────

  const openChat = async (order) => {
    setSelectedOrder(order);
    setShowChat(true);
    try {
      const res = await fetch(`${API}/api/orders/${order._id}/messages`, {
        credentials: 'include'
      });
      if (res.ok) setMessages(await res.json());
    } catch (err) { console.error('Action failed:', err); }
    socketRef.current?.emit('join_order_room', order._id);
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedOrder) return;
    socketRef.current?.emit('send_message', { orderId: selectedOrder._id, sender: user.id, text: newMessage, language: chatLang });
    setNewMessage('');
  };

  const toggleRecording = async () => {
    // Media recording logic...
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = e => audioChunksRef.current.push(e.data);
        mediaRecorder.onstop = () => {
           const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
           const reader = new FileReader();
           reader.readAsDataURL(blob);
           reader.onloadend = () => {
             socketRef.current?.emit('send_message', { 
               orderId: selectedOrder._id, 
               sender: user.id, 
               text: '🎤 Voice Message', 
               audioUrl: reader.result, 
               language: chatLang 
             });
           };
        };
        mediaRecorder.start();
        setIsRecording(true);
      } catch { alert('Microphone access denied'); }
    }
  };

  const handleReject = async (orderId) => {
    if (!window.confirm('Reject this industrial order?')) return;
    try {
      const res = await fetch(`${API}/api/orders/${orderId}/reject`, {
        method: 'PUT',
        credentials: 'include'
      });
      if (res.ok) fetchOrders();
    } catch (err) { console.error('Reject failed:', err); }
  };

  const handleCancel = async (orderId) => {
    const reason = window.prompt('Reason for cancellation?');
    if (reason === null) return;
    try {
      const res = await fetch(`${API}/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      if (res.ok) fetchOrders();
    } catch (err) { console.error('Cancel failed:', err); }
  };



  const handleStatusUpdate = async (orderId, status) => {
    const otp = otpInputs[orderId];
    try {
      const res = await fetch(`${API}/api/orders/${orderId}/status`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, otp })
      });
      if (res.ok) {
        alert('Status updated!');
        fetchOrders();
        socketRef.current?.emit('order_status_changed', { orderId, status });
      } else {
        const err = await res.json();
        alert(err.error || 'Update failed');
      }
    } catch (err) { console.error('Action failed:', err); }
  };

  const handleNegotiate = async (orderId) => {
    const rate = proposedRates[orderId];
    if (!rate) return alert('Enter rate');
    try {
      await fetch(`${API}/api/orders/${orderId}/negotiate`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposedRate: Number(rate), proposedDeliveryDate: proposedDates[orderId], counterNote: counterNotes[orderId] })
      });
      fetchOrders();
    } catch (err) { console.error('Action failed:', err); }
  };

  const handleAccept = async (orderId) => {
    try {
      await fetch(`${API}/api/orders/${orderId}/accept`, {
        method: 'PUT',
        credentials: 'include'
      });
      fetchOrders();
    } catch (err) { console.error('Action failed:', err); }
  };



  const handleMockPay = async () => {
    try {
      await fetch(`${API}/api/payment/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: payModal.order._id, mock: true })
      });
      setPayModal(null);
      fetchOrders();
      alert('Payment Successful!');
    } catch (err) { console.error('Action failed:', err); }
  };

  const handleReviewSubmit = async (order, rating, comment) => {
     try {
       await fetch(`${API}/api/reviews`, {
         method: 'POST',
         credentials: 'include',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ orderId: order._id, rating, comment })
       });
       setShowReview(null);
       fetchOrders();
     } catch (err) { console.error('Action failed:', err); }
  };

  const approveCompany = async (id) => {
    try {
      const res = await fetch(`${API}/api/admin/approve-company/${id}`, {
        method: 'PUT',
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || 'Company verified successfully');
        fetchAdminData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to verify company');
      }
    } catch (err) {
      console.error('Approve company failed:', err);
      alert('Network error while verifying company');
    }
  };


  const handleSuspendUser = async (id, suspend) => {
     await fetch(`${API}/api/admin/suspend-user/${id}`, { 
       method: 'PUT', 
       credentials: 'include',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ isSuspended: suspend })
     });
     fetchAdminData();
  };

  const handleViewUserDetails = (userDetails) => {
    setSelectedUserDetails(userDetails);
  };

  // ── Product CRUD Handlers ───────────────────────────────
  const openProductModal = (mode, product = null) => {
    setProductModal({ isOpen: true, product });
  };

  const handleSaveProduct = async (formData, productId = null) => {
    try {
      const url = productId ? `${API}/api/products/${productId}` : `${API}/api/products`;
      const method = productId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert(productId ? 'Product updated successfully!' : 'Product listed successfully!');
        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save product');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this industrial part? This cannot be undone.')) return;
    try {
      const res = await fetch(`${API}/api/products/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        alert('Product removed from inventory');
        fetchProducts();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;

  return (
    <div className="page-container" style={{ padding: '0 20px' }}>
      
      {/* Modals */}
      {payModal && <MockPayModal amount={payModal.amount} label={`Order Payment`} onSuccess={handleMockPay} onClose={() => setPayModal(null)} />}
      {showReview && <ReviewModal order={showReview} onClose={() => setShowReview(null)} onSubmit={handleReviewSubmit} />}
      {selectedUserDetails && <UserDetailsModal user={selectedUserDetails} onClose={() => setSelectedUserDetails(null)} />}
      <ProductModal 
        isOpen={productModal.isOpen} 
        product={productModal.product} 
        onClose={() => setProductModal({ isOpen: false, product: null })} 
        onSave={handleSaveProduct}
        API={API}
      />

      <div style={{ display: 'flex', gap: 24, minHeight: '80vh', position: 'relative' }}>
        
        <DashboardSidebar 
          view={view} 
          setView={setView} 
          isCompany={isCompany} 
          user={user} 
          isSidebarOpen={isSidebarOpen} 
          setIsSidebarOpen={setIsSidebarOpen} 
        />

        <main style={{ flex: 1, minWidth: 0, padding: '24px 0' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
                {view === 'orders' ? '📦 My Manufacturing Orders' : 
                 view === 'products' ? '🔧 Inventory Control' : 
                 view === 'analytics' ? '📈 Business Performance' : 
                 view === 'profile' ? '👤 Account Settings' : '🛡️ Platform Governance'}
              </h1>
              <p style={{ color: 'var(--slate-500)', margin: 0 }}>Welcome back, <span className="text-teal font-bold">{user.name}</span></p>
            </div>
            {isCompany && view === 'products' && (
              <button className="btn-primary" onClick={() => openProductModal('add')}>+ Add New Product</button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: (view === 'orders' && showChat) ? '1fr 380px' : '1fr', gap: 24, alignItems: 'start' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Governance Alerts */}
              {isCompany && !user.isApproved && (
                 <div className="card" style={{ background: 'var(--amber-50)', borderColor: 'var(--amber-200)', display: 'flex', alignItems: 'center', gap: 16 }}>
                    <ShieldAlert size={28} color="var(--amber-600)" />
                    <div>
                      <p style={{ fontWeight: 800, margin: 0, color: 'var(--amber-900)' }}>Industrial Profile Verification Pending</p>
                      <p style={{ margin: 0, fontSize: '.85rem', opacity: 0.8 }}>Admin team is reviewing your manufacturing credentials.</p>
                    </div>
                 </div>
              )}

              {/* View Routing */}
              {view === 'profile' ? <ProfileSection user={user} myReviews={myReviews} API={API} setView={setView} /> :
               view === 'admin' ? <AdminPanel stats={stats} allUsers={allUsers} pendingCompanies={pendingCompanies} page={page} setPage={setPage} handleSuspendUser={handleSuspendUser} handleViewUserDetails={handleViewUserDetails} approveCompany={approveCompany} /> :
               view === 'analytics' ? <AnalyticsView stats={stats} /> :
               isCompany && view === 'products' ? <InventoryManager myProducts={myProducts} openProductModal={openProductModal} deleteProduct={handleDeleteProduct} API={API} /> :
               (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {orders.length === 0 ? (
                      <div className="empty-state-v2"><Package size={48} opacity={0.2} /><p>No active orders found.</p></div>
                    ) : orders.map(order => (
                      <OrderCard 
                        key={order._id}
                        order={order} 
                        isCompany={isCompany} 
                        user={user} 
                        openChat={openChat} 
                        handleStatusUpdate={handleStatusUpdate}
                        handleAccept={handleAccept}
                        handleNegotiate={handleNegotiate}
                        handleReject={handleReject}
                        handleCancel={handleCancel}
                        setPayModal={setPayModal}
                        setShowReview={setShowReview}
                        proposedRates={proposedRates}
                        setProposedRates={setProposedRates}
                        proposedDates={proposedDates}
                        setProposedDates={setProposedDates}
                        counterNotes={counterNotes}
                        setCounterNotes={setCounterNotes}
                        otpInputs={otpInputs}
                        setOtpInputs={setOtpInputs}
                        API={API}
                      />
                    ))}
                 </div>
               )}
            </div>

            {showChat && selectedOrder && (
              <ChatPanel 
                selectedOrder={selectedOrder} 
                messages={messages} 
                user={user} 
                newMessage={newMessage} 
                setNewMessage={setNewMessage} 
                sendMessage={sendMessage} 
                toggleRecording={toggleRecording} 
                isRecording={isRecording} 
                chatLang={chatLang} 
                handleLanguageChange={setChatLang} 
                messagesEndRef={messagesEndRef} 
                setShowChat={setShowChat} 
              />
            )}
          </div>
        </main>
      </div>

      {/* AI Assistant */}
      <div style={{ position: 'fixed', bottom: 30, right: 30, zIndex: 1000 }}>
        <button 
          className="btn-primary" 
          style={{ width: 60, height: 60, borderRadius: '50%', boxShadow: '0 8px 32px rgba(13, 148, 136, 0.4)', padding: 0 }}
          onClick={() => alert("🤖 SEIRA AI Assistant: Analyzing industrial sourcing trends...")}
        >
          <Zap size={28} />
        </button>
      </div>
    </div>
  );
}
