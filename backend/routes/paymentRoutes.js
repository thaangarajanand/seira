const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');
const crypto = require('crypto');
const dotenv = require('dotenv');
const authMiddleware = require('../middleware/authMiddleware');
const Order = require('../models/Order');

dotenv.config();

const isMockMode = !process.env.RAZORPAY_KEY_ID ||
  process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_mock');

let razorpay;
if (!isMockMode) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

// POST /api/payment/create-order (Auth required)
router.post('/create-order', authMiddleware, async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt = 'receipt_' + Date.now(), orderId } = req.body;

    // Mock mode — return a simulated order
    if (isMockMode) {
      return res.json({
        id: 'mock_order_' + Date.now(),
        amount: Math.round(amount * 100),
        currency,
        mock: true,
        orderId
      });
    }

    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt,
    };

    const order = await razorpay.orders.create(options);
    if (!order) return res.status(500).send('Some error occurred');

    res.json({ ...order, orderId });
  } catch (error) {
    console.error('Razorpay create-order error:', error);
    res.status(500).json({ error: error.message || 'Payment creation failed' });
  }
});

// POST /api/payment/verify — Verify and update orders to accepted
router.post('/verify', authMiddleware, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId, orderIds, mock } = req.body;
    const idsToVerify = orderIds || (orderId ? [orderId] : []);

    if (idsToVerify.length === 0) {
      return res.status(400).json({ error: 'No order IDs provided for verification' });
    }

    // 1. Fetch all orders and verify ownership/state
    const orders = await Order.find({ _id: { $in: idsToVerify } });
    if (orders.length !== idsToVerify.length) {
      return res.status(404).json({ error: 'One or more orders not found' });
    }

    for (const order of orders) {
      if (String(order.customer) !== String(req.user.id)) {
        return res.status(403).json({ error: `Not authorized to pay for order ${order._id}` });
      }
      if (['shipped', 'completed', 'cancelled'].includes(order.status)) {
        return res.status(400).json({ error: `Order ${order._id} is already ${order.status}` });
      }
    }

    // 2. Calculate expected total amount
    const totalExpected = orders.reduce((sum, o) => sum + (o.finalRate || o.proposedRate || 0) * (o.quantity || 1), 0);

    // 3. Signature & Amount Verification
    if (mock || (razorpay_order_id && razorpay_order_id.startsWith('mock_order_'))) {
      // Mock mode validation
      console.log(`[Mock Payment] Verifying ₹${totalExpected} for ${idsToVerify.length} orders`);
    } else {
      // Real Razorpay signature verification
      const sign = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSign = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest('hex');

      if (razorpay_signature !== expectedSign) {
        return res.status(400).json({ message: 'Invalid payment signature' });
      }

      // Real Amount Verification: Fetch payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      if (payment.status !== 'captured' && payment.status !== 'authorized') {
        return res.status(400).json({ error: 'Payment not successful in Razorpay' });
      }
      
      // Razorpay amount is in paise
      if (Math.round(payment.amount / 100) < Math.round(totalExpected)) {
        return res.status(400).json({ error: 'Payment amount mismatch' });
      }
    }

    // 4. Atomic Updates
    console.log(`✅ Payment verified for ${idsToVerify.length} orders. Updating status...`);
    await Order.updateMany(
      { _id: { $in: idsToVerify } },
      { status: 'processing', paymentId: razorpay_payment_id }
    );

    return res.status(200).json({ 
      message: 'Payment verified successfully', 
      count: idsToVerify.length,
      total: totalExpected,
      mock: !!(mock || (razorpay_order_id && razorpay_order_id.startsWith('mock_order_')))
    });
  } catch (error) {
    console.error('❌ Payment verify error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/payment/config — Return public key and mode for frontend
router.get('/config', (req, res) => {
  res.json({
    keyId: isMockMode ? null : process.env.RAZORPAY_KEY_ID,
    mock: isMockMode
  });
});

module.exports = router;
