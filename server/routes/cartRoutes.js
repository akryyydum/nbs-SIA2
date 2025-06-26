const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/AuthMiddleware');
const Cart = require('../models/cart.model');

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

// Remove a single item from cart
router.delete('/:itemId', protect, async (req, res) => {
  const { itemId } = req.params;
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ message: 'Cart not found' });

  const initialLength = cart.items.length;
  cart.items = cart.items.filter(item => item._id.toString() !== itemId);

  if (cart.items.length === initialLength) {
    return res.status(404).json({ message: 'Cart item not found' });
  }

  cart.updatedAt = new Date();
  await cart.save();
  res.json({ message: 'Item removed', cart });
});

module.exports = router;
