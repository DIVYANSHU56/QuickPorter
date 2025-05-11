const express = require('express');
const router = express.Router();

// Dummy offers data
const offers = [
  { id: 1, description: "10% off on first booking" },
  { id: 2, description: "Free cancellation within 1 hour" },
  { id: 3, description: "Refer a friend and get $5 credit" }
];

// In-memory live location store (for demo purposes)
const liveLocations = {};

// Get available offers
router.get('/offers', (req, res) => {
  res.status(200).json({ success: true, offers });
});

// Update live location for a booking
router.post('/location', (req, res) => {
  const { bookingId, userType, lat, lng } = req.body;
  if (!bookingId || !userType || lat === undefined || lng === undefined) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }
  if (!liveLocations[bookingId]) {
    liveLocations[bookingId] = {};
  }
  liveLocations[bookingId][userType] = { lat, lng, timestamp: Date.now() };
  res.status(200).json({ success: true, message: 'Location updated' });
});

// Get live location for a booking
router.get('/location/:bookingId', (req, res) => {
  const bookingId = req.params.bookingId;
  if (!liveLocations[bookingId]) {
    return res.status(404).json({ success: false, message: 'No location data found' });
  }
  res.status(200).json({ success: true, locations: liveLocations[bookingId] });
});

module.exports = router;
