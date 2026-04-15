const express = require('express');
const router = express.Router();
const { refineRequirements } = require('../services/groqService');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

// POST /api/ai/refine - Refine customization requirements
router.post('/refine', authMiddleware, async (req, res) => {
  const { description, dimensions } = req.body;
  try {
    const refined = await refineRequirements(description, dimensions);
    res.json({ refined });
  } catch (error) {
    res.status(500).json({ error: 'AI refinement failed' });
  }
});

// PUT /api/ai/language - Update user preferred language
router.put('/language', authMiddleware, async (req, res) => {
  const { language } = req.body;
  try {
    await User.findByIdAndUpdate(req.user.id, { preferredLanguage: language });
    res.json({ message: 'Language preference updated' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update language' });
  }
});

module.exports = router;
