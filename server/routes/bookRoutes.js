const express = require('express');
const router = express.Router();
const { protect, admin, inventory } = require('../middleware/AuthMiddleware');
const { createBook, getBooks, getBookById, updateBook, deleteBook, decreaseStock } = require('../controllers/bookController');

// Public: Get all books
router.get('/', getBooks);

// Public: Get single book by ID
router.get('/:id', getBookById);

// Admin & Inventory: Create a new book
router.post('/', protect, inventory, createBook);

// Admin & Inventory: Update a book
router.put('/:id', protect, inventory, updateBook);

// Admin & Inventory: Delete a book
router.delete('/:id', protect, inventory, deleteBook);

// Admin & Inventory: Decrease stock of a book
router.put('/:id/decrease-stock', protect, inventory, decreaseStock);

router.post('/', upload.single('image'), bookController.createBook);

module.exports = router;
