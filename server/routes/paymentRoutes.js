const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/AuthMiddleware');
const { createPaymentIntent, confirmPayment } = require('../controllers/paymentController');

// Create a payment intent (user must be logged in)
router.post('/create-intent', protect, createPaymentIntent);

// Confirm a payment (user must be logged in)
router.post('/confirm', protect, confirmPayment);

module.exports = router;
