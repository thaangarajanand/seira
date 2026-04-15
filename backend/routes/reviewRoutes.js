const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const User = require('../models/User');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/reviews/company/:companyId — get all reviews for a company
router.get('/company/:companyId', async (req, res) => {
  try {
    const reviews = await Review.find({ company: req.params.companyId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/product/:productId — get all reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/can-review/:orderId — check if current user can review
router.get('/can-review/:orderId', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    
    const alreadyReviewed = await Review.findOne({
      order: req.params.orderId,
      customer: req.user.id
    });

    res.json({
      canReview: order.status === 'completed' && 
                 String(order.customer) === req.user.id && 
                 !alreadyReviewed,
      alreadyReviewed: !!alreadyReviewed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reviews/can-review-product/:productId — check if current user can review this product
router.get('/can-review-product/:productId', authMiddleware, async (req, res) => {
  try {
    // Find a completed order for this product by this user
    const order = await Order.findOne({
      product: req.params.productId,
      customer: req.user.id,
      status: 'completed'
    });

    if (!order) return res.json({ canReview: false, reason: 'No completed order found for this product.' });

    const alreadyReviewed = await Review.findOne({
      order: order._id,
      customer: req.user.id
    });

    res.json({
      canReview: !alreadyReviewed,
      orderId: order._id,
      companyId: order.company
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/reviews — Submit a review (customer only, order must be completed)
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'customer') {
      return res.status(403).json({ error: 'Only customers can submit reviews' });
    }

    const { companyId, orderId, rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Verify order is completed and belongs to this customer
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (String(order.customer) !== req.user.id) {
      return res.status(403).json({ error: 'This order does not belong to you' });
    }
    if (order.status !== 'completed') {
      return res.status(400).json({ error: 'Order must be completed before reviewing' });
    }

    // Prevent duplicate reviews
    const existing = await Review.findOne({ order: orderId, customer: req.user.id });
    if (existing) return res.status(400).json({ error: 'You have already reviewed this order' });

    const review = new Review({
      company: companyId || order.company,
      customer: req.user.id,
      order: orderId,
      product: order.product || null,
      rating: Number(rating),
      comment
    });
    await review.save();

    // Recalculate company's average rating and update completed Orders Count is handled in order status changing to completed. Here we just update ratings.
    const compId = companyId || order.company;
    const allCompReviews = await Review.find({ company: compId });
    const compAvg = allCompReviews.reduce((sum, r) => sum + r.rating, 0) / allCompReviews.length;
    await User.findByIdAndUpdate(compId, {
      averageRating: Math.round(compAvg * 10) / 10
    });

    if (order.product) {
      const Product = require('../models/Product');
      const allProductReviews = await Review.find({ product: order.product });
      const prodAvg = allProductReviews.reduce((sum, r) => sum + r.rating, 0) / allProductReviews.length;
      await Product.findByIdAndUpdate(order.product, {
        averageRating: Math.round(prodAvg * 10) / 10,
        reviewCount: allProductReviews.length
      });
    }

    const populated = await Review.findById(review._id).populate('customer', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
