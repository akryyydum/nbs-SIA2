const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/AuthMiddleware');
const Cart = require('../models/cart.model');
const cartController = require('../controllers/cartController');

// Get current user's cart
router.get('/', protect, async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate('items.book');
  if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
  res.json(cart);
});

// Add/update cart
router.post('/', protect, async (req, res) => {
  const { items } = req.body;
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });
  cart.items = items;
  cart.updatedAt = new Date();
  await cart.save();
  res.json(cart);
});

// Clear cart
router.delete('/', protect, async (req, res) => {
  await Cart.findOneAndDelete({ user: req.user._id });
  res.json({ message: 'Cart cleared' });
});

// Remove a single item from cart and restore stock
router.delete('/:itemId', protect, cartController.removeCartItemAndRestoreStock);

// DELETE a single item from cart by item ID
router.delete('/:id', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const itemId = req.params.id;
    const cart = await Cart.findOne({ user: userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(item => item._id.toString() !== itemId);
    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    await cart.save();
    res.json({ message: 'Item removed from cart', cart });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add to cart and update stock atomically
router.post('/add', protect, cartController.addToCart);

module.exports = router;
