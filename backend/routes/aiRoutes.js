const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { refineRequirements, chatWithAI } = require('../services/groqService');

// POST /api/ai/refine - Refine industrial requirements
router.post('/refine', authMiddleware, async (req, res) => {
  const { notes, dimensions } = req.body;
  try {
    const refined = await refineRequirements(notes, dimensions);
    res.json({ refined });
  } catch (error) {
    console.error('AI refinement error:', error);
    res.status(500).json({ error: 'Requirement refinement failed' });
  }
});

// POST /api/ai/chat - General AI Assistant chat
router.post('/chat', authMiddleware, async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Messages array is required' });
  }

  try {
    const response = await chatWithAI(messages);
    res.json({ response });
  } catch (error) {
    console.error('AI chat route error:', error);
    res.status(500).json({ error: 'AI Assistant failed' });
  }
});

module.exports = router;
