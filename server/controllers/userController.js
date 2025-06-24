const User = require('../models/user.model');
const mongoose = require('mongoose');

// @desc    Get all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a user (admin only)
exports.createUser = async (req, res) => {
  const { name, email, password, role, status } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    const user = await User.create({ name, email, password, role, status });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Update a user (admin only)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, role, status } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.name = name ?? user.name;
    user.email = email ?? user.email;
    user.role = role ?? user.role;
    user.status = status ?? user.status;
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete a user (admin only)
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }
    // Prevent admin from deleting themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await User.deleteOne({ _id: id });
    res.json({ message: 'User removed' });
  } catch (err) {
    console.error('Delete user error:', err); // Add this for debugging
    res.status(500).json({ message: err.message || 'Server error' });
  }
};
