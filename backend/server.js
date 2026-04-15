const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

// CORS — allow frontend dev server
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

// Serve uploaded drawings as static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/SEIRA')
  .then(() => console.log('✅ MongoDB Connected to', process.env.MONGO_URI))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'SEIRA API is running', version: '2.0.0' });
});

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/cart', require('./routes/cartRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/ai', require('./routes/aiRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// ── Socket.IO ─────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id);

  // Join a room per order for chat + location isolation
  socket.on('join_order_room', (orderId) => {
    socket.join(orderId);
    console.log(`User ${socket.id} joined room: ${orderId}`);
  });

  // Real-time chat between customer and company
  socket.on('send_message', async (data) => {
    // data: { orderId, sender, text, language }
    try {
      const Message = require('./models/Message');
      const Order = require('./models/Order');
      const User = require('./models/User');
      const { translateMessage } = require('./services/groqService');

      // Find recipient's language preference
      const order = await Order.findById(data.orderId).populate('customer company');
      if (!order) return;

      const isSenderCustomer = String(data.sender) === String(order.customer._id);
      const recipient = isSenderCustomer ? order.company : order.customer;
      
      let translation = '';
      if (recipient && !data.audioUrl) {
        translation = await translateMessage(data.text, data.language || 'en', recipient.preferredLanguage || 'en');
        // If translation is same as original, clear it to save space
        if (translation === data.text) translation = '';
      }

      const newMessage = new Message({
        order: data.orderId,
        sender: data.sender,
        text: data.text,
        language: data.language,
        translation: translation,
        audioUrl: data.audioUrl
      });
      await newMessage.save();

      const populatedMsg = await Message.findById(newMessage._id)
        .populate('sender', 'name role');
      io.to(data.orderId).emit('receive_message', populatedMsg);
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  // Live delivery location tracking
  socket.on('update_location', async (data) => {
    // data: { orderId, lat, lng }
    try {
      const Order = require('./models/Order');
      await Order.findByIdAndUpdate(data.orderId, {
        currentLocation: { lat: data.lat, lng: data.lng, updatedAt: new Date() }
      });
      io.to(data.orderId).emit('location_updated', {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error updating location:', err);
    }
  });

  // Order status broadcast (e.g., when company marks delivered)
  socket.on('order_status_changed', (data) => {
    // data: { orderId, status }
    io.to(data.orderId).emit('order_status_updated', data);
  });

  socket.on('disconnect', () => {
    console.log('👋 User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 SEIRA Server running on http://localhost:${PORT}`);
});
