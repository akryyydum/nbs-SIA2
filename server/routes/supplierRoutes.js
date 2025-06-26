const express = require('express');
const router = express.Router();
const Supplier = require('../models/supplier.model');
const Book = require('../models/books.model'); // Add this line

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all books for a supplier
router.get('/:id/books', async (req, res) => {
  try {
    const books = await Book.find({ supplier: req.params.id });
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get supplier KPIs for dashboard
router.get('/kpis', async (req, res) => {
  try {
    const totalSuppliers = await Supplier.countDocuments();
    const activeSuppliers = await Supplier.countDocuments({ status: 'active' });
    const inactiveSuppliers = await Supplier.countDocuments({ status: 'inactive' });

    // Most used supplier: the one with the most books
    const agg = await Book.aggregate([
      { $group: { _id: "$supplier", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    let mostUsedSupplier = null;
    if (agg.length && agg[0]._id) {
      const sup = await Supplier.findById(agg[0]._id);
      mostUsedSupplier = sup ? sup.companyName : String(agg[0]._id);
    }

    // New suppliers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    const newSuppliersThisMonth = await Supplier.countDocuments({ createdAt: { $gte: startOfMonth } });

    res.json({
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      mostUsedSupplier,
      newSuppliersThisMonth
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Optionally: Add more supplier CRUD routes here

module.exports = router;
