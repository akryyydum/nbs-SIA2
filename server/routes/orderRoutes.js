const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/AuthMiddleware');
const {
  createOrder,
  getMyOrders,
  getAllOrders,
  getOrderById,
  deleteOrder
} = require('../controllers/orderController');

// User: Create order
router.post('/', protect, createOrder);

// User: Get own orders
router.get('/my', protect, getMyOrders);

// Admin: Get all orders
router.get('/', protect, admin, getAllOrders);

// Admin or owner: Get order by ID
router.get('/:id', protect, getOrderById);

// Admin: Delete order
router.delete('/:id', protect, admin, deleteOrder);

module.exports = router;
