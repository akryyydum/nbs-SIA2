// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admins only' });
  }
};

// /middleware/AuthMiddleware.js

exports.inventory = (req, res, next) => {
  const allowedRoles = ['inventory department', 'admin']; // allow both roles
  const userRole = req.user?.role;

  if (userRole && allowedRoles.includes(userRole)) {
    return next();
  }

  return res.status(403).json({ message: 'Access denied: Inventory or Admin role required' });
};
