const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  pickup: String,
  drop: String,
  date: String,
  itemType: String,
  status: {
    type: String,
    enum: ['pending', 'assigned', 'completed', 'cancelled'],
    default: 'pending'
  },
  price: {
    type: Number,
    default: 0
  },
  assignedPorter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Porter',
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  feedback: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null
  },
  currentLocation: {
    latitude: {
      type: Number,
      default: null
    },
    longitude: {
      type: Number,
      default: null
    }
  }
});

module.exports = mongoose.model('Booking', bookingSchema);
