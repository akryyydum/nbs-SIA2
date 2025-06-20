const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/AuthMiddleware');
const { createBook, getBooks, getBookById, updateBook, deleteBook } = require('../controllers/bookController');

// Public: Get all books
router.get('/', getBooks);

// Public: Get single book by ID
router.get('/:id', getBookById);

// Admin: Create a new book
router.post('/', protect, admin, createBook);

// Admin: Update a book
router.put('/:id', protect, admin, updateBook);

// Admin: Delete a book
router.delete('/:id', protect, admin, deleteBook);

module.exports = router;
