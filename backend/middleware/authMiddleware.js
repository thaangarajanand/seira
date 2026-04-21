const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  // Try to get token from cookie or Authorization header
  let token = req.cookies.token;
  
  if (!token && req.header('Authorization')) {
    token = req.header('Authorization').replace('Bearer ', '');
  }

  if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify user still exists
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists' });
    }

    // ── SLIDING SESSION FOR ADMINS ─────────────────────
    if (user.role === 'admin') {
      const now = Math.floor(Date.now() / 1000);
      const remainingSec = decoded.exp - now;
      
      // If less than 10 minutes left, renew
      if (remainingSec < 10 * 60) {
        const newToken = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '30m' });
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('token', newToken, {
          httpOnly: true,
          secure: isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https',
          sameSite: (isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https') ? 'none' : 'lax',
          maxAge: 30 * 60 * 1000
        });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
