const express = require('express');
const router = express.Router();

let pricing = {
  pricePerKm: 1.0,
  pricesByType: {
    light: 20.0,
    heavy: 40.0,
    vehicle: 100.0
  }
};

// Get current pricing
router.get('/', (req, res) => {
  res.status(200).send({ success: true, pricing });
});

// Update pricing
router.post('/', (req, res) => {
  const { pricePerKm, pricesByType } = req.body;

  if (typeof pricePerKm !== 'number' || pricePerKm < 0) {
    return res.status(400).send({ success: false, message: 'Invalid pricePerKm. Must be a non-negative number.' });
  }

  if (typeof pricesByType !== 'object' || pricesByType === null) {
    return res.status(400).send({ success: false, message: 'Invalid pricesByType. Must be an object.' });
  }

  for (const [type, price] of Object.entries(pricesByType)) {
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).send({ success: false, message: `Invalid price for type ${type}. Must be a non-negative number.` });
    }
  }

  pricing.pricePerKm = pricePerKm;
  pricing.pricesByType = pricesByType;

  console.log('Pricing updated:', pricing);
  res.status(200).send({ success: true, message: 'Pricing updated successfully', pricing });
});

module.exports = router;
