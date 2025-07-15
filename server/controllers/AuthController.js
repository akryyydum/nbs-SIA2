// controllers/authController.js
const User = require('../models/user.model');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');

// Ensure default admin exists
(async () => {
  await User.deleteOne({ email: 'admin@admin.com' }); // Always remove existing admin
  const hashedPassword = await bcrypt.hash('admin', 10); // password is 'admin'
  await User.create({
    name: 'Admin',
    email: 'admin@admin.com',
    password: hashedPassword,
    role: 'admin',
    status: 'active'
  });
  console.log('✅ Default admin created: admin@admin.com / admin');
})();

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) return res.status(400).json({ message: 'User already exists' });

  // Always set status to 'pending' on registration; activate after OTP (for customers)
  const status = 'pending';
  const user = await User.create({ name, email, password, role, status });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status
    // No token returned, user must verify OTP before login (handled on frontend)
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Only block non-customers with pending/declined status
    if (user.role !== 'customer') {
      if (user.status === 'pending') {
        return res.status(403).json({ message: 'Your account is pending approval by admin.' });
      }
      if (user.status === 'declined') {
        return res.status(403).json({ message: 'Your registration was declined by admin.' });
      }
    }

    const token = generateToken(user);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

