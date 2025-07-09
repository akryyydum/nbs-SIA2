const Cart = require('../models/cart.model');
const Book = require('../models/books.model');

// Add to cart and update book stock
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { bookId, quantity } = req.body;
    if (!bookId || !quantity || quantity < 1) {
      return res.status(400).json({ message: 'Invalid book or quantity' });
    }
    const book = await Book.findById(bookId);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.stock < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }
    // Decrement stock
    book.stock -= quantity;
    await book.save();
    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) cart = new Cart({ user: userId, items: [] });
    // Check if book already in cart
    const idx = cart.items.findIndex(item => item.book.toString() === bookId);
    if (idx !== -1) {
      cart.items[idx].quantity += quantity;
    } else {
      cart.items.push({ book: bookId, quantity });
    }
    cart.updatedAt = new Date();
    await cart.save();
    res.json({ message: 'Added to cart', cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Remove a single item from cart and restore stock
exports.removeCartItemAndRestoreStock = async (req, res) => {
  try {
    const userId = req.user._id;
    const itemId = req.params.itemId;
    let cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    const item = cart.items.find(item => item._id.toString() === itemId);
    if (!item) return res.status(404).json({ message: 'Cart item not found' });
    // Restore stock
    const book = await Book.findById(item.book);
    if (book) {
      book.stock += item.quantity;
      await book.save();
    }
    // Remove item from cart
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    cart.updatedAt = new Date();
    await cart.save();
    res.json({ message: 'Item removed and stock restored', cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
