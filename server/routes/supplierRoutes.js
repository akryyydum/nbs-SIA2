const express = require('express');
const router = express.Router();
const Supplier = require('../models/supplier.model');
const Book = require('../models/books.model'); // Add this line
const SupplierBook = require('../models/supplierBook.model'); // Add this line

// Get all suppliers
router.get('/', async (req, res) => {
  try {
    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new supplier
router.post('/', async (req, res) => {
  try {
    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ message: err.message });
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

// Get all books for a supplier from SupplierBook collection
router.get('/:id/supplierBook', async (req, res) => {
  try {
    const supplierBooks = await SupplierBook.find({ supplier: req.params.id });
    res.json(supplierBooks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get supplier KPIs for dashboard (updated to count both Supplier collection and users with supplier roles)
router.get('/kpis', async (req, res) => {
  try {
    const SupplierModel = require('../models/supplier.model');
    const UserModel = require('../models/user.model');
    const Book = require('../models/books.model');

    // Count suppliers in Supplier collection
    const supplierCount = await SupplierModel.countDocuments();
    // Count users with role 'supplier department' or 'supplier' (if you use that role)
    const userSupplierCount = await UserModel.countDocuments({ role: { $in: ['supplier department', 'supplier'] } });
    const totalSuppliers = supplierCount + userSupplierCount;

    // Active/inactive from Supplier collection only (for now)
    const activeSuppliers = await SupplierModel.countDocuments({ status: 'active' });
    const inactiveSuppliers = await SupplierModel.countDocuments({ status: 'inactive' });

    // Most used supplier: the one with the most books
    const agg = await Book.aggregate([
      { $group: { _id: "$supplier", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);
    let mostUsedSupplier = null;
    if (agg.length && agg[0]._id) {
      const sup = await SupplierModel.findById(agg[0]._id);
      mostUsedSupplier = sup ? sup.companyName : String(agg[0]._id);
    }

    // New suppliers this month (from Supplier collection only)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    const newSuppliersThisMonth = await SupplierModel.countDocuments({ createdAt: { $gte: startOfMonth } });

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

// CRUD for Supplier's own books
// GET all books for a supplier (already exists above)

// POST: Add a book to supplier's catalog
router.post('/:id/books', async (req, res) => {
  try {
    const { title, author, price, category, description, image, stock } = req.body;
    const supplierId = req.params.id;
    const book = new SupplierBook({
      supplier: supplierId,
      title,
      author,
      price,
      category,
      description,
      image,
      stock,
    });
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST: Add a book to SupplierBook collection for a supplier
router.post('/:id/supplierBook', async (req, res) => {
  try {
    const { title, author, price, category, description, image, stock } = req.body;
    const supplierId = req.params.id;
    const book = new SupplierBook({
      supplier: supplierId,
      title,
      author,
      price,
      category,
      description,
      image,
      stock,
    });
    await book.save();
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT: Update a supplier's book
router.put('/:supplierId/books/:bookId', async (req, res) => {
  try {
    const { supplierId, bookId } = req.params;
    const book = await SupplierBook.findOne({ _id: bookId, supplier: supplierId });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    Object.assign(book, req.body);
    await book.save();
    res.json(book);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE: Remove a supplier's book
router.delete('/:supplierId/books/:bookId', async (req, res) => {
  try {
    const { supplierId, bookId } = req.params;
    const book = await SupplierBook.findOneAndDelete({ _id: bookId, supplier: supplierId });
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Utility: Copy all current books for a supplier to SupplierBook database
router.post('/:id/copy-books-to-supplier-db', async (req, res) => {
  try {
    const supplierId = req.params.id;
    // Find all books in the main Book collection for this supplier
    const books = await Book.find({ supplier: supplierId });
    if (!books.length) return res.status(404).json({ message: 'No books found for this supplier.' });

    // Prepare SupplierBook documents
    const supplierBooks = books.map(b => ({
      supplier: supplierId,
      title: b.title,
      author: b.author,
      price: b.price,
      category: b.category,
      description: b.description,
      image: b.image,
      stock: b.stock,
    }));

    // Insert into SupplierBook collection
    await SupplierBook.insertMany(supplierBooks);

    res.json({ message: `Copied ${supplierBooks.length} books to SupplierBook database.` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Increase stock of a supplier's book
router.put('/:supplierId/supplierBook/:bookId/increase-stock', async (req, res) => {
  try {
    const { supplierId, bookId } = req.params;
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be provided and greater than 0' });
    }
    const supplierBook = await SupplierBook.findOne({ _id: bookId, supplier: supplierId });
    if (!supplierBook) return res.status(404).json({ message: 'Book not found in supplier catalog' });

    // Try to find the book in the main Book collection
    let book = await Book.findOne({ title: supplierBook.title, author: supplierBook.author, supplier: supplierId });

    if (book) {
      // If book exists in main collection, increase its stock
      book.stock += quantity;
      await book.save();
    } else {
      // If not, create it in the main Book collection
      book = new Book({
        title: supplierBook.title,
        author: supplierBook.author,
        price: supplierBook.price,
        category: supplierBook.category,
        supplier: supplierBook.supplier,
        description: supplierBook.description,
        stock: quantity,
        image: supplierBook.image
      });
      await book.save();
    }

    // Optionally, also increase stock in SupplierBook (if you want to track supplier's own stock)
    supplierBook.stock += quantity;
    await supplierBook.save();

    res.json({ message: 'Book added to inventory and stock updated', book });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a supplier
router.put('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json(supplier);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a supplier
router.delete('/:id', async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Optionally: Add more supplier CRUD routes here

module.exports = router;
