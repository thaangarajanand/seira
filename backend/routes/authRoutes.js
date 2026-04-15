const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, companyName } = req.body;

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
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role === 'company' && !user.isApproved) {
      return res.status(403).json({ error: 'Account pending admin approval' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
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
    const { name, phone, address, bio, location, preferredLanguage } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, phone, address, bio, location, preferredLanguage },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
