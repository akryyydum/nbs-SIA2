const Order = require('../models/order.model');
const Book = require('../models/books.model');
const SupplierBook = require('../models/supplierBook.model');
const Notification = require('../models/notification.model'); // Make sure this model exists
const User = require('../models/user.model'); // Add at the top if not already

// @desc    Create a new order
// @route   POST /api/orders
exports.createOrder = async (req, res) => {
  const { items, modeofPayment } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }
  if (!modeofPayment) {
    return res.status(400).json({ message: 'modeofPayment is required' });
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

      // Deduct stock immediately when order is placed
      if (book.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for "${book.title}"` });
      }
      book.stock -= item.quantity;
      await book.save();

      // Reduce supplier book stock if this is a supplier book
      if (book.supplier) {
        const SupplierBook = require('../models/supplierBook.model');
        let supplierBook = await SupplierBook.findOne({ _id: item.book, supplier: book.supplier });
        if (supplierBook) {
          supplierBook.stock = Math.max(0, supplierBook.stock - item.quantity);
          await supplierBook.save();
        }
      }
    }

    const status =
      modeofPayment === "Bank Transfer" || modeofPayment === "bank"
        ? "paid"
        : "pending";

    const order = new Order({
      user: req.user._id,
      items: enrichedItems,
      totalPrice,
      modeofPayment,
      status // <-- use the computed status
    });

    const savedOrder = await order.save();

    // Notify all admin and sales department users
    const notifyUsers = await User.find({ role: { $in: ['admin', 'sales department'] } });
    const notifications = notifyUsers.map(u => ({
      user: u._id,
      title: 'New Order Placed',
      description: `A new order (${savedOrder._id}) has been placed by ${req.user.name || req.user.email}.`,
      order: savedOrder._id,
      read: false,
    }));
    if (notifications.length) {
      await Notification.insertMany(notifications);
    }

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
    // Only fetch orders that are NOT supplier orders
    const orders = await Order.find({
      $or: [
        { isSupplierOrder: { $exists: false } },
        { isSupplierOrder: false }
      ]
    })
      .populate('user', 'name email')
      .populate('items.book');
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

    // Restore stock for each book in the order
    for (const item of order.items) {
      let book = await Book.findById(item.book);
      if (book) {
        book.stock += item.quantity;
        await book.save();
      }
      // Optionally handle supplierBook if needed
    }

    await Order.deleteOne({ _id: order._id });
    res.json({ message: 'Order removed and stock restored' });
  } catch (err) {
    console.error('Delete order error:', err);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
};

// @desc    Accept order (admin only): set status to 'out for delivery' and decrease book stocks
// @route   PUT /api/orders/:id/accept
exports.acceptOrder = async (req, res) => {
  console.log('acceptOrder called by:', req.user.role, req.user.email);
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending orders can be accepted' });
    }

    // Remove stock deduction logic here (already handled in createOrder)

    // If cash, set to delivered, else accepted
    if (order.modeofPayment === "Cash") {
      order.status = "received";
    } else {
      order.status = "accepted";
    }
    await order.save();

    // --- Notification for customer: Accepted ---
    try {
      await Notification.create({
        user: order.user,
        title: 'Order Accepted',
        description: `Your order ${order._id} has been accepted.`,
        order: order._id,
        read: false,
      });
    } catch (notifErr) {
      console.error('Notification creation error:', notifErr);
    }

    res.json({ message: 'Order accepted successfully', order });
  } catch (err) {
    console.error('Error in acceptOrder:', err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
};


// @desc    Decline order (admin only): set status to 'declined' and restore stock
// @route   PUT /api/orders/:id/decline
exports.declineOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Allow admin, sales department, or the owner (customer) to cancel
    const isAdminOrSales = req.user.role === 'admin' || req.user.role === 'sales department';
    const isOwner = order.user.toString() === req.user._id.toString();

    if (!isAdminOrSales && !isOwner) {
      return res.status(403).json({ message: 'Forbidden: Only admin, sales department, or the order owner can cancel.' });
    }

    if (order.status === 'declined') {
      return res.status(400).json({ message: 'Order is already declined' });
    }
    if (order.status !== 'pending' && order.status !== 'accepted' && order.status !== 'out for delivery') {
      return res.status(400).json({ message: 'Order cannot be declined at this stage' });
    }

    // Restore stock for each book in the order
    for (const item of order.items) {
      let book = await Book.findById(item.book);
      if (book) {
        book.stock += item.quantity;
        await book.save();
      }
      // Restore SupplierBook stock if applicable
      if (book && book.supplier) {
        let supplierBook = await SupplierBook.findOne({ _id: item.book, supplier: book.supplier });
        if (supplierBook) {
          supplierBook.stock += item.quantity;
          await supplierBook.save();
        }
      }
    }

    order.status = 'declined';
    await order.save();
    res.json({ message: 'Order declined and stock restored' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Ship order (admin only): set status to 'out for delivery'
// @route   PUT /api/orders/:id/ship
exports.shipOrder = async (req, res) => {
  console.log('shipOrder called by:', req.user.role, req.user.email);
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted orders can be shipped' });
    }

    order.status = 'out for delivery';
    await order.save();

    // --- Notification for customer: Shipped ---
    await Notification.create({
      user: order.user,
      title: 'Order Shipped',
      description: `Your order ${order._id} has been shipped.`,
      order: order._id,
      read: false,
    });

    res.json({ message: 'Order shipped successfully' });
  } catch (err) {
    console.error('Error in shipOrder:', err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  }
};

// @desc    Mark order as received (admin or sales department)
// @route   PUT /api/orders/:id/received
exports.markOrderReceived = async (req, res) => {
  console.log('markOrderReceived called by:', req.user.role, req.user.email);
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Only allow owner or admin/sales
    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'sales department' &&
      order.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (order.status !== 'out for delivery') {
      return res.status(400).json({ message: 'Order is not out for delivery' });
    }
    order.status = 'received';
    await order.save();

    // --- Notification for customer: Delivered ---
    await Notification.create({
      user: order.user,
      title: 'Order Delivered',
      description: `Your order ${order._id} has been delivered.`,
      order: order._id,
      read: false,
    });

    res.json({ message: 'Order marked as received' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get order visuals data (admin/sales only)
// @route   GET /api/orders/visuals
// exports.getOrderVisuals = async (req, res) => {
//   try {
//     const orders = await Order.find({ status: { $in: ['accepted', 'paid'] } }).populate('items.book');

//     // Top products for bar chart
//     const productCount = {};
//     orders.forEach(order => {
//       order.items.forEach(item => {
//         if (!item.book) return;
//         const title = item.book.title || 'Unknown';
//         productCount[title] = (productCount[title] || 0) + item.quantity;
//       });
//     });
//     const salesByProduct = Object.entries(productCount)
//       .map(([title, sales]) => ({ title, sales }));

//     // Sales by category for line chart
//     const categorySales = {};
//     orders.forEach(order => {
//       order.items.forEach(item => {
//         if (!item.book) return;
//         const cat = item.book.category || 'Uncategorized';
//         categorySales[cat] = (categorySales[cat] || 0) + (item.quantity * (item.book.price || 0));
//       });
//     });
//     const salesByCategory = Object.entries(categorySales).map(([category, value]) => ({ category, value }));

//     res.json({
//       salesByProduct,
//       salesByCategory,
//     });
//   } catch (err) {
//     console.error('Order Visuals Error:', err);
//     res.status(500).json({ message: err.message || 'Failed to fetch visuals' });
//   }
// };
