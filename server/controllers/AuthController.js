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

  // Register all users (including admins) as active immediately
  const user = await User.create({ name, email, password, role, status: 'active' });
  const token = generateToken(user);

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  // Prevent login if admin registration is pending
  if (user.role === 'admin' && user.status === 'pending') {
    return res.status(403).json({ message: 'Admin registration pending approval' });
  }

  const token = generateToken(user);

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token
  });
};
