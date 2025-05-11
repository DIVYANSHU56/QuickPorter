const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');

// Generate summary report
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find();

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);

    const feedbacks = bookings
      .filter(b => b.feedback && b.feedback.trim() !== '')
      .map(b => ({ name: b.name, feedback: b.feedback, rating: b.rating }));

    const statusCounts = bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    const report = {
      totalBookings,
      totalRevenue,
      statusCounts,
      feedbacks
    };

    res.status(200).send({ success: true, report });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).send({ success: false, message: 'Error generating report: ' + error.message });
  }
});

module.exports = router;
