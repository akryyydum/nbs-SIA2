const express = require('express');
const router = express.Router();
const { protect, admin, sales } = require('../middleware/AuthMiddleware');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  deleteOrder,
  acceptOrder,
  declineOrder,
  shipOrder,
  getOrderMetrics,
  markOrderReceived
} = require('../controllers/orderController');
const Order = require('../models/order.model');

// User: Create order
router.post('/', protect, createOrder);

// User: Get own orders
router.get('/my', protect, getMyOrders);

// Admin: Get all orders
router.get('/', protect, sales, getAllOrders);

// Accept order
router.put('/:id/accept', protect, sales, acceptOrder);
router.put('/:id/ship', protect, sales, shipOrder);

// Decline order
router.put('/:id/decline', protect, sales, declineOrder);

// Mark as received
router.put('/:id/received', protect, markOrderReceived);

// Admin or owner: Get order by ID
router.get('/:id', protect, getOrderById);

// Admin: Delete order
router.delete('/:id', protect, sales, deleteOrder);

// Get order visuals
// router.get('/visuals', protect, sales, getOrderVisuals);

// User: Get recent transactions (for notifications)
router.get('/transactions', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('items.book');
    const notifications = orders.map(order => ({
      _id: order._id,
      title: `Order ${order._id.toString().slice(-6)}`,
      description: `Status: ${order.status}, Total: ₱${Number(order.totalPrice).toFixed(2)}`,
      createdAt: order.createdAt
    }));
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
