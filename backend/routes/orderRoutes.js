const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

// Rate limiter for OTP verification (5 attempts per 15 minutes)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many OTP attempts. Please try again after 15 minutes.' }
});

// GET /api/orders — Get orders for current user (customer or company)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // ── NEGOTIATION TIMEOUT LOGIC ──────────────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    // Auto-cancel negotiations stuck for > 7 days
    await Order.updateMany(
      { status: 'negotiating', updatedAt: { $lt: sevenDaysAgo } },
      { status: 'cancelled', cancellationReason: 'Negotiation expired due to inactivity (7+ days).' }
    );

    let query;
    if (req.user.role === 'company') {
      // Company sees: their assigned orders + any unassigned pending custom orders
      query = {
        $or: [
          { company: req.user.id },
          { status: 'pending', type: 'custom', company: { $exists: false } },
          { status: 'pending', type: 'custom', company: null }
        ]
      };
    } else {
      query = { customer: req.user.id };
    }

    const orders = await Order.find(query)
      .populate('customer', 'name email location address')
      .populate('company', 'name companyName averageRating completedOrdersCount location address')
      .populate({
        path: 'product',
        populate: { path: 'companyId', select: 'name companyName' }
      })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id — Get a single order
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email location address')
      .populate('company', 'name companyName averageRating completedOrdersCount location address')
      .populate({
        path: 'product',
        populate: { path: 'companyId', select: 'name companyName' }
      });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders — Create a new order (standard or custom)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      type,
      product: productId,
      drawings,
      description,
      proposedRate,
      proposedDeliveryDate,
      quantity
    } = req.body;

    let companyId = req.body.company;

    // If standard product, verify stock and auto-assign
    if (type === 'standard' && productId) {
      const Product = require('../models/Product');
      const p = await Product.findById(productId);
      if (!p) return res.status(404).json({ error: 'Product not found' });
      
      const requestedQty = Number(quantity) || 1;
      if (p.stock < requestedQty) {
        return res.status(400).json({ error: `Not enough stock available. Remaining: ${p.stock}` });
      }

      // Atomically decrement stock
      await Product.findByIdAndUpdate(productId, { $inc: { stock: -requestedQty } });
      companyId = p.companyId;
    }

    const newOrder = new Order({
      type,
      customer: req.user.id,
      company: companyId || null,
      product: productId || null,
      drawings: drawings || [],
      description,
      proposedRate: Number(proposedRate),
      proposedDeliveryDate,
      quantity: Number(quantity) || 1,
      status: 'pending_approval',
      finalRate: type === 'standard' ? Number(proposedRate) : null,
      finalDeliveryDate: type === 'standard' ? proposedDeliveryDate : null,
      deliveryAddress: req.body.deliveryAddress || {
        name: req.user.name,
        phone: req.user.phone,
        street: req.user.street,
        city: req.user.city,
        state: req.user.state,
        pincode: req.user.pincode,
        lat: req.user.location?.lat,
        lng: req.user.location?.lng
      }
    });

    await newOrder.save();
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('company', 'name companyName averageRating')
      .populate('product');
      
    res.status(201).json(populatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/negotiate — Company proposes a changed rate
router.put('/:id/negotiate', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'company') {
      return res.status(403).json({ error: 'Only companies can negotiate' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    if (['accepted', 'shipped', 'completed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ error: `Cannot negotiate an order that is already ${order.status}` });
    }

    if (order.company && String(order.company) !== String(req.user.id)) {
      return res.status(400).json({ error: 'Order is already locked by another company' });
    }

    const { proposedRate, proposedDeliveryDate, counterNote } = req.body;
    order.proposedRate = Number(proposedRate);
    order.proposedDeliveryDate = proposedDeliveryDate;
    order.counterNote = counterNote;
    order.status = 'negotiating';
    order.company = req.user.id;
    
    await order.save();
    const populated = await Order.findById(order._id)
      .populate('customer', 'name email location address')
      .populate('company', 'name companyName location address');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/accept — Accept an order (company accepts, or customer accepts negotiated rate)
router.put('/:id/accept', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (['shipped', 'completed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ error: `Cannot accept an order that is already ${order.status}` });
    }

    // ORDER LOCK: If company is accepting, check if someone else already did
    if (req.user.role === 'company') {
      if (order.company && String(order.company) !== String(req.user.id)) {
        return res.status(400).json({ error: 'Order already accepted by another company' });
      }
      order.company = req.user.id;
    }

    // Set final rate/date to whatever was last proposed
    order.finalRate = order.proposedRate;
    order.finalDeliveryDate = order.proposedDeliveryDate;
    order.status = 'accepted';

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/cancel — Cancel an order (customer or company)
router.put('/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (['shipped', 'completed', 'cancelled'].includes(order.status)) {
      return res.status(400).json({ error: `Cannot cancel an order that is already ${order.status}` });
    }

    // Role verification
    const cancelledBy = req.user.role === 'customer' ? 'customer' : 'company';
    if (cancelledBy === 'customer' && String(order.customer) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to cancel this order' });
    }
    if (cancelledBy === 'company' && order.company && String(order.company) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Not authorized to reject this order' });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason || 'No reason provided';
    order.cancelledBy = cancelledBy;

    // Restore stock if it was a standard product
    if (order.type === 'standard' && order.product) {
      const Product = require('../models/Product');
      await Product.findByIdAndUpdate(order.product, { $inc: { stock: order.quantity || 1 } });
    }

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Original reject route — delegating to cancel
router.put('/:id/reject', authMiddleware, async (req, res) => {
  res.redirect(307, `/api/orders/${req.params.id}/cancel`);
});

// PUT /api/orders/:id/status — Update order status (shipped, completed, etc.)
router.put('/:id/status', authMiddleware, otpLimiter, async (req, res) => {
  try {
    const { status, otp } = req.body;
    const allowedStatuses = ['pending', 'pending_approval', 'negotiating', 'accepted', 'processing', 'quality_check', 'shipped', 'out_for_delivery', 'completed', 'cancelled', 'payment_failed'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // SECURITY: Only assigned company or customer (depending on status) can update
    if (req.user.role === 'company') {
      if (order.company && String(order.company) !== String(req.user.id)) {
        return res.status(403).json({ error: 'Not authorized for this order' });
      }
    }

    // Role-based status restrictions
    if (status === 'shipped' || status === 'out_for_delivery' || status === 'completed') {
      if (req.user.role !== 'company') {
        return res.status(403).json({ error: 'Only vendors can update shipping/completion status' });
      }
    }
    
    if (status === 'cancelled' && req.user.role !== 'customer') {
      // Allow companies to reject/cancel before acceptance? Usually 'reject' is used.
    }

    const updateData = { status };

    // OTP GENERATION: When shipping or out for delivery
    if ((status === 'shipped' || status === 'out_for_delivery') && !order.completionOTP) {
      updateData.completionOTP = Math.floor(100000 + Math.random() * 900000).toString();
    }

    // OTP VERIFICATION: When completing
    if (status === 'completed') {
      if (req.user.role !== 'company') {
        return res.status(403).json({ error: 'Only companies can mark as completed' });
      }
      if (!otp || otp !== order.completionOTP) {
        return res.status(400).json({ error: 'Invalid Delivery OTP' });
      }
      // Increment company count
      if (order.company) {
        await User.findByIdAndUpdate(order.company, { $inc: { completedOrdersCount: 1 } });
      }
    }

    const updated = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id/messages — Get chat messages for an order
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const Message = require('../models/Message');
    const messages = await Message.find({ order: req.params.id })
      .populate('sender', 'name role')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
