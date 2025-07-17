const User = require('../models/user.model');
const mongoose = require('mongoose');

// @desc    Get all users (admin and supplier department)
exports.getUsers = async (req, res) => {
  try {
    let users;
    if (req.user.role === 'admin') {
      users = await User.find().select('-password');
    } else if (req.user.role === 'supplier department') {
      users = await User.find({ role: 'supplier department' }).select('-password');
    } else {
      return res.status(403).json({ message: 'Forbidden' });
    }
    res.json(users); // createdAt is included by default
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Create a user (admin only)
exports.createUser = async (req, res) => {
  const { name, email, password, role, status } = req.body;
  // Data validation
  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'Name, email, password, and role are required.' });
  }
  // Simple email format check
  const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }
  // Password length check
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters.' });
  }
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });
    // Always set status to 'pending' for registration and admin creation unless admin explicitly sets 'active' or 'declined'
    let newStatus = 'pending';
    if (
      req.user && req.user.role === 'admin' &&
      (status === 'active' || status === 'declined')
    ) {
      newStatus = status;
    }
    const user = await User.create({ 
      name, 
      email, 
      password, 
      role, 
      status: newStatus 
    });
    res.status(201).json({ 
      _id: user._id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      status: user.status,
      createdAt: user.createdAt // <-- add this line
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Update a user (admin only)
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, status } = req.body;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Only admin can update role and status
    if (req.user.role === 'admin') {
      user.role = role ?? user.role;
      user.status = status ?? user.status;
    }
    // Any user can update their own name, email, and password
    user.name = name ?? user.name;
    user.email = email ?? user.email;
    if (password) user.password = password;

    await user.save();
    // If password was updated, return '***' as a placeholder
    const response = { _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status };
    if (password) response.password = '********';
    res.json(response);
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

// @desc    Accept a user (admin only)
exports.acceptUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.status = 'active';
    await user.save();
    res.json({ message: 'User accepted', user: { _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Decline a user (admin only)
exports.declineUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.status = 'declined';
    await user.save();
    res.json({ message: 'User declined', user: { _id: user._id, name: user.name, email: user.email, role: user.role, status: user.status } });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
