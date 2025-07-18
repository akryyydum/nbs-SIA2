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
  // allow inventory department, supplier department, and admin
  const allowedRoles = ['inventory department', 'supplier department', 'admin'];
  const userRole = req.user?.role;

  if (userRole && allowedRoles.includes(userRole)) {
    return next();
  }

  return res.status(403).json({ message: 'Access denied: Inventory, Supplier, or Admin role required' });
};

exports.supplier = (req, res, next) => {
  const allowedRoles = ['supplier department', 'admin', 'inventory department']; 
  const userRole = req.user?.role;

  if (userRole && allowedRoles.includes(userRole)) {
    return next();
    }
    return res.status(403).json({ message: 'Access denied: Supplier, Inventory, or Admin role required' });
};

exports.sales = (req, res, next) => {
  const allowedRoles = ['sales department', 'admin'];
  if (req.user && allowedRoles.includes(req.user.role)) {
    return next();
  }
  res.status(403).json({ message: 'Forbidden: Sales department or Admins only' });
};

exports.adminOrSupplier = (req, res, next) => {
  const allowedRoles = ['admin', 'supplier department'];
  if (req.user && allowedRoles.includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: Admin or Supplier Department only' });
};

// AuthMiddleware.js
exports.adminOrSales = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.role === 'sales department') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden' });
  }
};

// Allow user to update their own profile, or admin can update anyone
exports.canEditProfile = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authorized' });
  // Admin can edit anyone, any user (including customer) can edit their own profile
  if (
    req.user.role === 'admin' ||
    req.user._id.toString() === req.params.id
  ) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden: You can only edit your own profile.' });
};
