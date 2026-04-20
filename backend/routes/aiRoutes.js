const { refineRequirements, chatWithAI } = require('../services/groqService');

// ... (existing /refine and /language routes)

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
