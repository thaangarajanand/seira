const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
  try {
    let { name, email, password, role, companyName } = req.body;
    email = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role: role || 'customer',
      isApproved: role === 'company' ? false : true, // Companies need admin approval
      companyName: role === 'company' ? companyName : undefined
    });

    await newUser.save();
    res.status(201).json({ message: role === 'company' ? 'Registration submitted for approval' : 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    let { email, password, captchaAnswer } = req.body;
    email = email.toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    // Check account lockout
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const remaining = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(403).json({ error: `Account locked. Please try again after ${remaining} minutes.` });
    }

    // Admin Specific Security: CAPTCHA Check
    if (user.role === 'admin' && user.loginAttempts >= 3) {
      if (!captchaAnswer) {
        // Generate new question
        const n1 = Math.floor(Math.random() * 10) + 1;
        const n2 = Math.floor(Math.random() * 10) + 1;
        // We store the answer in a temporary signature or just prompt them to try again with answer
        // To be simple, we tell the frontend to show the field and generate a question
        return res.status(401).json({ 
          error: 'Security Check: Please solve the CAPTCHA',
          requireCaptcha: true,
          captchaQuestion: `What is ${n1} + ${n2}?`,
          captchaExpected: n1 + n2 // In production, usually hash this or store in session
        });
      }
      
      // Verification of answer passed from frontend (which was given the expected answer in previous fail)
      const { captchaExpected } = req.body; 
      if (Number(captchaAnswer) !== Number(captchaExpected)) {
         return res.status(401).json({ error: 'Incorrect CAPTCHA answer. Please try again.' });
      }
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      user.loginAttempts += 1;
      // Lockout logic
      if (user.role === 'admin' && user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
      }
      await user.save();

      // Return captcha requirement if needed for next time
      let response = { error: 'Invalid email or password' };
      if (user.role === 'admin' && user.loginAttempts >= 3) {
        const n1 = Math.floor(Math.random() * 10) + 1;
        const n2 = Math.floor(Math.random() * 10) + 1;
        response = { 
          ...response, 
          requireCaptcha: true, 
          captchaQuestion: `What is ${n1} + ${n2}?`,
          captchaExpected: n1 + n2
        };
      }
      return res.status(401).json(response);
    }

    // Success - Reset security tracking
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginIP = req.ip || req.headers['x-forwarded-for'];
    user.lastLoginDevice = req.headers['user-agent'];
    await user.save();

    // Session duration
    const isAdmin = user.role === 'admin';
    const expiresIn = isAdmin ? '30m' : '1d';
    const maxAge = isAdmin ? 30 * 60 * 1000 : 24 * 60 * 60 * 1000;

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn });
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https',
      sameSite: (isProduction || req.secure || req.headers['x-forwarded-proto'] === 'https') ? 'none' : 'lax', // Needed for cross-domain cookies
      maxAge
    });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        companyName: user.companyName
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/top-company', async (req, res) => {
  try {
    const topCompany = await User.findOne({ role: 'company', isApproved: true })
      .sort({ averageRating: -1 });
    res.json(topCompany);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, address, street, city, state, pincode, bio, location, preferredLanguage, companyName } = req.body;
    
    const updateData = { name, phone, address, street, city, state, pincode, bio, location, preferredLanguage };
    if (req.user.role === 'company' && companyName !== undefined) {
      updateData.companyName = companyName;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
