const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ isApproved: true }).populate({
      path: 'companyId',
      match: { isApproved: true },
      select: 'name companyName averageRating completedOrdersCount portfolioImages'
    });
    // Filter out products where company was not approved (companyId became null)
    const validProducts = products.filter(p => p.companyId != null);
    res.json(validProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/my-products — Get products for the current company (including pending)
router.get('/my-products', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'company') {
      return res.status(403).json({ error: 'Only companies can access their products' });
    }
    const products = await Product.find({ companyId: req.user.id });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('companyId', 'name companyName averageRating completedOrdersCount portfolioImages bio location address phone');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'company') {
      return res.status(403).json({ error: 'Only companies can list products' });
    }
    if (!req.user.isApproved) {
      return res.status(403).json({ error: 'Your company is pending admin approval and cannot add products yet.' });
    }
    const { name, description, category, price, imageUrl } = req.body;
    const normalizedCategory = category ? category.trim().toUpperCase() : undefined;
    const product = new Product({
      name,
      description,
      category: normalizedCategory,
      price,
      imageUrl,
      companyId: req.user.id
    });
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    if (String(product.companyId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized to update this product' });
    }
    if (!req.user.isApproved) {
      return res.status(403).json({ error: 'Your company is pending admin approval and cannot update products.' });
    }

    if (req.body.category) {
      req.body.category = req.body.category.trim().toUpperCase();
    }
    Object.assign(product, req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    if (String(product.companyId) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Unauthorized to delete this product' });
    }

    await product.deleteOne();
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
