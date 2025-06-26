const express = require('express');
const router = express.Router();
const { protect, admin, sales } = require('../middleware/AuthMiddleware');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  deleteOrder,
  acceptOrder,    // add this
  declineOrder,    // add this
  getOrderMetrics
} = require('../controllers/orderController');
// User: Create order
router.post('/', protect, createOrder);

// User: Get own orders
router.get('/my', protect, getMyOrders);

// Admin: Get all orders
router.get('/', protect, sales, getAllOrders);

// Admin or owner: Get order by ID
router.get('/:id', protect, getOrderById);

// Admin: Delete order
router.delete('/:id', protect, sales, deleteOrder);

// Accept order
router.put('/:id/accept', protect, sales, acceptOrder);

// Decline order
router.put('/:id/decline', protect, sales, declineOrder);

// Get order metrics
router.get('/metrics', protect, sales, getOrderMetrics);

module.exports = router;
