const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// Get all users (admin)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}, '-password'); // exclude password field
    res.status(200).send({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send({ success: false, message: 'Error fetching users: ' + error.message });
  }
});

// Update user details (admin)
router.patch('/:id', async (req, res) => {
  try {
    const { name, email, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (role && ['customer', 'admin', 'porter'].includes(role)) user.role = role;
    await user.save();
    res.status(200).send({ success: true, message: 'User updated', user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(400).send({ success: false, message: 'Error updating user' });
  }
});

// Delete user (admin)
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }
    res.status(200).send({ success: true, message: 'User deleted' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(400).send({ success: false, message: 'Error deleting user' });
  }
});

// Update porter availability
router.patch('/:id/availability', async (req, res) => {
  try {
    const { availability } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send({ success: false, message: 'User not found' });
    }
    console.log('User role for availability update:', user.role);
    if (user.role !== 'porter') {
      return res.status(403).send({ success: false, message: 'User is not a porter' });
    }
    if (typeof availability !== 'boolean') {
      return res.status(400).send({ success: false, message: 'Invalid availability value' });
    }
    user.availability = availability;
    await user.save();
    res.status(200).send({ success: true, message: 'Availability updated', availability: user.availability });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(400).send({ success: false, message: 'Error updating availability' });
  }
});

module.exports = router;
