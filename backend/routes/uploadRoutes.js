const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authMiddleware = require('../middleware/authMiddleware');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9.\-_]/g, '');
    cb(null, Date.now() + '-' + safeName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/svg+xml'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Only images and PDFs are allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// POST /api/upload — Upload up to 5 drawing files
router.post('/', authMiddleware, upload.array('drawings', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files uploaded' });
  }

  const urls = req.files.map(f => `/uploads/${f.filename}`);
  res.json({ urls, count: urls.length });
});

module.exports = router;
