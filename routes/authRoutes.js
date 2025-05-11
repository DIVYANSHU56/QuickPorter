const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Signup route
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).send({ success: false, message: 'Name, email, and password are required' });
    }
    if (role && !['customer', 'porter', 'admin'].includes(role)) {
      return res.status(400).send({ success: false, message: 'Invalid role specified' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send({ success: false, message: 'Email already registered' });
    }
    const user = new User({ name, email, password, role: role || 'customer' });
    await user.save();
    res.status(201).send({ success: true, message: 'User registered successfully' });
  } catch (error) {
    console.error('Signup error:', error.message, error.stack);
    res.status(500).send({ success: false, message: 'Error registering user' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).send({ success: false, message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).send({ success: false, message: 'Invalid email or password' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).send({ success: false, message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(200).send({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error.message, error.stack);
    res.status(500).send({ success: false, message: 'Error logging in' });
  }
});

module.exports = router;
