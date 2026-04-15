const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

// GET /api/cart — Get current user's cart
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('cart.product');
    res.json(user.cart || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart — Sync entire cart (overwrites/updates)
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { cart } = req.body; // Expects array of cart items
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { cart },
      { new: true }
    ).populate('cart.product');
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart/add — Add a single item
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { product, type, quantity, customData } = req.body;
    const user = await User.findById(req.user.id);

    // If item already exists in cart, update quantity (only for standard items)
    const existingIndex = user.cart.findIndex(item => 
      String(item.product) === String(product) && item.type === 'standard' && item.type === type
    );

    if (existingIndex > -1 && type === 'standard') {
      user.cart[existingIndex].quantity += (Number(quantity) || 1);
    } else {
      user.cart.push({ product, type, quantity, customData });
    }

    await user.save();
    const updatedUser = await User.findById(req.user.id).populate('cart.product');
    res.json(updatedUser.cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/:itemId — Remove an item from cart
router.delete('/:itemId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.cart = user.cart.filter(item => String(item._id) !== String(req.params.itemId));
    await user.save();
    res.json(user.cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart — Clear cart
router.delete('/', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { cart: [] });
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
