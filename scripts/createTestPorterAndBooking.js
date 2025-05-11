const mongoose = require('mongoose');
const User = require('../models/User');
const Booking = require('../models/Booking');

async function createTestPorterAndBooking() {
  try {
    await mongoose.connect('mongodb://localhost:27017/quickporter', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Check if test porter exists
    let porter = await User.findOne({ email: 'testporter@example.com' });
    if (!porter) {
      porter = new User({
        name: 'Test Porter',
        email: 'testporter@example.com',
        password: 'password123', // You may want to hash or set properly in real app
        role: 'porter',
        availability: true,
      });
      await porter.save();
      console.log('Test porter user created');
    } else {
      console.log('Test porter user already exists');
    }

    // Create a test booking assigned to the porter
    const bookingData = {
      name: 'Test Customer',
      email: 'testcustomer@example.com',
      pickup: '123 Test St',
      drop: '456 Destination Ave',
      date: new Date(),
      itemType: 'light',
      price: 20,
      assignedPorter: porter._id,
      status: 'pending',
      paymentStatus: 'pending',
    };

    const existingBooking = await Booking.findOne({ email: bookingData.email, assignedPorter: porter._id });
    if (!existingBooking) {
      const booking = new Booking(bookingData);
      await booking.save();
      console.log('Test booking created and assigned to porter');
    } else {
      console.log('Test booking already exists');
    }

    await mongoose.disconnect();
    console.log('Done');
  } catch (error) {
    console.error('Error creating test porter and booking:', error);
  }
}

createTestPorterAndBooking();
