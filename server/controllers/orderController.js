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
    // Calculate total price and enrich items with category and supplier
    let totalPrice = 0;
    const enrichedItems = [];
    for (const item of items) {
      const book = await Book.findById(item.book);
      if (!book) return res.status(404).json({ message: 'Book not found' });
      totalPrice += book.price * item.quantity;
      enrichedItems.push({
        book: item.book,
        quantity: item.quantity,
        category: book.category,
        supplier: book.supplier
      });
    }

    const order = new Order({
      user: req.user._id,
      items: enrichedItems,
      totalPrice,
      status: 'pending' // Ensure status is set to 'pending' on creation
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

// @desc    Delete order (admin or sales department)
// @route   DELETE /api/orders/:id
exports.deleteOrder = async (req, res) => {
  console.log('Delete order requested by:', req.user);
  if (!['admin', 'sales department'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: Only admin or sales department can delete orders' });
  }
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    await Order.deleteOne({ _id: order._id }); // <-- Use deleteOne instead of remove
    res.json({ message: 'Order removed' });
  } catch (err) {
    console.error('Delete order error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

// @desc    Accept order (admin only): set status to 'accepted' and decrease book stocks
// @route   PUT /api/orders/:id/accept
exports.acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order is not pending' });
    }
    // Decrease stock for each book
    for (const item of order.items) {
      // item.book may be an ObjectId, not populated
      const bookId = item.book && item.book._id ? item.book._id : item.book;
      const book = await Book.findById(bookId);
      if (!book) {
        console.error(`Book not found for item:`, item);
        return res.status(400).json({ message: `Book not found for item in order.` });
      }
      if (typeof book.stock !== 'number') {
        console.error(`Book stock is invalid for book:`, book);
        return res.status(400).json({ message: `Book stock is invalid for ${book.title}` });
      }
      if (book.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${book.title}` });
      }
      book.stock -= item.quantity;
      await book.save();
    }
    order.status = 'accepted';
    await order.save();
    res.json({ message: 'Order accepted and stocks updated' });
  } catch (err) {
    console.error('Error in acceptOrder:', err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
};

// @desc    Decline order (admin only): set status to 'declined'
// @route   PUT /api/orders/:id/decline
exports.declineOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Order is not pending' });
    }
    order.status = 'declined';
    await order.save();
    res.json({ message: 'Order declined' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get order visuals data (admin/sales only)
// @route   GET /api/orders/visuals
exports.getOrderVisuals = async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ['accepted', 'paid'] } }).populate('items.book');

    // Top products for bar chart
    const productCount = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!item.book) return;
        const title = item.book.title || 'Unknown';
        productCount[title] = (productCount[title] || 0) + item.quantity;
      });
    });
    const salesByProduct = Object.entries(productCount)
      .map(([title, sales]) => ({ title, sales }));

    // Sales by category for line chart
    const categorySales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (!item.book) return;
        const cat = item.book.category || 'Uncategorized';
        categorySales[cat] = (categorySales[cat] || 0) + (item.quantity * (item.book.price || 0));
      });
    });
    const salesByCategory = Object.entries(categorySales).map(([category, value]) => ({ category, value }));

    res.json({
      salesByProduct,
      salesByCategory,
    });
  } catch (err) {
    console.error('Order Visuals Error:', err);
    res.status(500).json({ message: err.message || 'Failed to fetch visuals' });
  }
};
