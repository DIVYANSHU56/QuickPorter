const express = require('express');
const router = express.Router();

const offers = [
  { id: 1, description: '10% off on your first booking' },
  { id: 2, description: 'Free cancellation within 24 hours' },
  { id: 3, description: 'Flat ₹50 off on vehicle moving' }
];

router.get('/offers', (req, res) => {
  res.status(200).json({ success: true, offers });
});

module.exports = router;
