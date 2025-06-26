const Stripe = require('stripe');
const Order = require('../models/order.model');

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create a Stripe payment intent for an order
// @route   POST /api/payments/create-intent
exports.createPaymentIntent = async (req, res) => {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ message: 'Order ID required' });

  try {
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only allow owner or admin
    if (req.user.role !== 'admin' && order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100), // Stripe expects amount in cents
      currency: 'usd',
      metadata: { orderId: order._id.toString() }
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.confirmPayment = async (req, res) => {
  const { orderId, paymentIntentId } = req.body;
  if (!orderId || !paymentIntentId) {
    return res.status(400).json({ message: 'Order ID and PaymentIntent ID required' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not successful' });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    order.status = 'paid';
    await order.save();

    res.json({ message: 'Payment confirmed and order updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
