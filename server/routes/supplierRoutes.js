const express = require('express');
const router = express.Router();
const Supplier = require('../models/supplier.model');

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Optionally: Add more supplier CRUD routes here

module.exports = router;
