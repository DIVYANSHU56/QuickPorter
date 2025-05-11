
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const nodemailer = require('nodemailer');
const pricing = require('./pricingRoutes').pricing;
const User = require('../models/User');
router.post('/', async (req, res) => {
  try {
    const { itemType, email, name, paymentMethod } = req.body;
    const pricingData = {
      pricePerKm: 1.0,
      priceLight: 2.0,
      priceHeavy: 40.0,
      priceVehicle: 100.0
    };
    let price = 0;
    switch (itemType) {
      case 'light':
        price = pricingData.priceLight;
        break;
      case 'heavy':
        price = pricingData.priceHeavy;
        break;
      case 'vehicle':
        price = pricingData.priceVehicle;
        break;
      default:
        price = 0;
    }
    const availablePorter = await User.findOne({ role: 'porter', availability: true });
    if (!availablePorter) {
      return res.status(400).send({ success: false, message: 'No available porter found' });
    }
    const bookingData = { ...req.body, price, assignedPorter: availablePorter._id, paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending' };
    const booking = new Booking(bookingData);
    await booking.save();
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Booking Confirmation - QuickPorter',
      text: `Dear ${name},\n\nYour booking has been confirmed.\n\nDetails:\nPickup: ${booking.pickup}\nDrop: ${booking.drop}\nDate: ${booking.date}\nItem Type: ${booking.itemType}\nPrice: $${booking.price}\nPayment Method: ${paymentMethod}\n\nThank you for choosing QuickPorter!`
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
      } else {
        console.log('Email sent:', info.response);
      }
    });
    res.status(201).send({ success: true, message: 'Booking confirmed!', booking });
  } catch (error) {
    res.status(400).send({ success: false, message: 'Error saving booking' });
  }
});

router.patch('/:id/feedback', async (req, res) => {
  try {
    const { feedback, rating } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).send({ success: false, message: 'Booking not found' });
    }
    if (feedback !== undefined) booking.feedback = feedback;
    if (rating !== undefined) {
      if (typeof rating === 'number' && rating >= 1 && rating <= 5) {
        booking.rating = rating;
      } else {
        return res.status(400).send({ success: false, message: 'Invalid rating value' });
      }
    }
    await booking.save();
    res.status(200).send({ success: true, message: 'Feedback updated', booking });
  } catch (error) {
    res.status(400).send({ success: false, message: 'Error updating feedback' });
  }
});

router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find();
    res.status(200).send({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).send({ success: false, message: 'Error fetching bookings: ' + error.message });
  }
});

router.get('/porter/:porterId', async (req, res) => {
  try {
    const porterId = req.params.porterId;
    if (!mongoose.Types.ObjectId.isValid(porterId)) {
      return res.status(400).send({ success: false, message: 'Invalid porter ID' });
    }
    const bookings = await Booking.find({ assignedPorter: porterId });
    res.status(200).send({ success: true, bookings });
  } catch (error) {
    console.error('Error fetching porter bookings:', error);
    res.status(500).send({ success: false, message: 'Error fetching porter bookings' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { status, assignedPorter, rating, feedback, paymentStatus } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).send({ success: false, message: 'Booking not found' });
    }
    if (status) booking.status = status;
    if (assignedPorter) {
      if (!mongoose.Types.ObjectId.isValid(assignedPorter)) {
        return res.status(400).send({ success: false, message: 'Invalid assignedPorter ID' });
      }
      booking.assignedPorter = assignedPorter;
    }
    if (rating !== undefined) {
      if (typeof rating === 'number' && rating >= 1 && rating <= 5) {
        booking.rating = rating;
      } else {
        return res.status(400).send({ success: false, message: 'Invalid rating value' });
      }
    }
    if (feedback !== undefined) {
      booking.feedback = feedback;
    }
    if (paymentStatus) {
      if (['pending', 'paid', 'failed'].includes(paymentStatus)) {
        booking.paymentStatus = paymentStatus;
      } else {
        return res.status(400).send({ success: false, message: 'Invalid paymentStatus value' });
      }
    }
    await booking.save();
    if (assignedPorter) {
      req.app.locals.notifyPorter(assignedPorter, booking);
    }
    res.status(200).send({ success: true, message: 'Booking updated', booking });
  } catch (error) {
    console.error('Error updating booking:', error.stack || error);
    res.status(400).send({ success: false, message: 'Error updating booking' });
  }
});

router.patch('/:id/location', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).send({ success: false, message: 'Booking not found' });
    }
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return res.status(400).send({ success: false, message: 'Invalid latitude or longitude' });
    }
    booking.currentLocation = { latitude, longitude };
    await booking.save();
    res.status(200).send({ success: true, message: 'Location updated', currentLocation: booking.currentLocation });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(400).send({ success: false, message: 'Error updating location' });
  }
});

router.patch('/:id/payment', async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).send({ success: false, message: 'Booking not found' });
    }
    if (!['pending', 'paid', 'failed'].includes(paymentStatus)) {
      return res.status(400).send({ success: false, message: 'Invalid paymentStatus value' });
    }
    booking.paymentStatus = paymentStatus;
    await booking.save();
    res.status(200).send({ success: true, message: 'Payment status updated', paymentStatus: booking.paymentStatus });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(400).send({ success: false, message: 'Error updating payment status' });
  }
});

module.exports = router;
