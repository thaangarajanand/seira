const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Order = require('../models/Order');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to restrict access to ADMIN only (restricted to specific emails)
const adminOnly = (req, res, next) => {
  // Relaxed for local dev: permit any user with 'admin' role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Authorized admins only.' });
  }
  next();
};

// GET /api/admin/pending-companies — List companies waiting for approval (with pagination)
router.get('/pending-companies', authMiddleware, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { role: 'company', isApproved: false };
    const total = await User.countDocuments(query);
    const companies = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      companies,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/users — List all users with pagination
router.get('/users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await User.countDocuments();
    const users = await User.find()
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/suspend-user/:id — Suspend or Unsuspend a user
router.put('/suspend-user/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { isSuspended } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { isSuspended }, { new: true }).select('-password');
    res.json({ message: `User ${user.name} ${isSuspended ? 'suspended' : 'unsuspended'} successfully`, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/pending-products — List products waiting for moderation
router.get('/pending-products', authMiddleware, adminOnly, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const products = await Product.find({ isApproved: false }).populate('companyId', 'name companyName');
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/approve-product/:id — Approve a product
router.put('/approve-product/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const product = await Product.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    res.json({ message: `Product ${product.name} approved successfully`, product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/admin/approve-company/:id — Approve a company
router.put('/approve-company/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const company = await User.findByIdAndUpdate(req.params.id, { isApproved: true }, { new: true });
    res.json({ message: `Company ${company.companyName} approved successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats — Get marketplace analytics
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const companyCount = await User.countDocuments({ role: 'company' });
    const orderCount = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$finalRate' } } }
    ]);

    // GMV over time (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const gmvTrend = await Order.aggregate([
      { $match: { status: 'completed', updatedAt: { $gte: sixMonthsAgo } } },
      { $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$updatedAt" } },
        revenue: { $sum: "$finalRate" }
      }},
      { $sort: { "_id": 1 } }
    ]);

    res.json({
      users: userCount,
      companies: companyCount,
      orders: orderCount,
      revenue: totalRevenue[0]?.total || 0,
      gmvTrend
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
