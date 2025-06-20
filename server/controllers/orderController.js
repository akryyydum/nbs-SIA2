const Order = require('../models/order.model');
const Book = require('../models/books.model');

// @desc    Create a new order
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  try {
    // Calculate total price
    let totalPrice = 0;
    for (const item of items) {
      const book = await Book.findById(item.book);
      if (!book) return res.status(404).json({ message: 'Book not found' });
      totalPrice += book.price * item.quantity;
    }

    const order = new Order({
      user: req.user._id,
      items,
      totalPrice
    });

    const savedOrder = await order.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Get orders for logged-in user
// @route   GET /api/orders/my
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('items.book');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get all orders (admin)
// @route   GET /api/orders
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'name email').populate('items.book');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get order by ID (admin or owner)
// @route   GET /api/orders/:id
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email').populate('items.book');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only admin or owner can access
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Delete order (admin only)
// @route   DELETE /api/orders/:id
exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await order.remove();
    res.json({ message: 'Order removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
