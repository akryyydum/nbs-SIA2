const Book = require('../models/books.model');

// @desc    Create a new book (Admin & Inventory department)
// @route   POST /api/books
exports.createBook = async (req, res) => {
  const { title, author, price, description, stock, image, category, supplier } = req.body;

  try {
    const book = new Book({ title, author, price, description, stock, image, category, supplier });
    const savedBook = await book.save();
    res.status(201).json(savedBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Get all books
// @route   GET /api/books
exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find();
    res.json(books);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Get single book by ID
// @route   GET /api/books/:id
exports.getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Update a book (Admin & Inventory department)
// @route   PUT /api/books/:id
exports.updateBook = async (req, res) => {
  const { title, author, price, description, stock, image } = req.body;

  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });

    book.title = title || book.title;
    book.author = author || book.author;
    book.price = price || book.price;
    book.category = req.body.category || book.category; // Assuming category is part of the request body
    book.supplier = req.body.supplier || book.supplier; // Assuming supplier is part of the request body
    book.description = description || book.description;
    book.stock = stock || book.stock;
    book.image = image || book.image;

    const updatedBook = await book.save();
    res.json(updatedBook);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Delete a book (Admin & Inventory department)
// @route   DELETE /api/books/:id
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      console.error(`Book with ID ${req.params.id} not found`);
      return res.status(404).json({ message: 'Book not found' });
    }

    await book.remove();
    res.json({ message: 'Book removed' });
  } catch (err) {
    console.error(`Error deleting book with ID ${req.params.id}:`, err);
    res.status(500).json({ message: err.message });
  }
};

// @desc    Decrease stock of a book
// @route   PUT /api/books/:id/decrease-stock
exports.decreaseStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'Quantity must be provided and greater than 0' });
    }
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (book.stock < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }
    book.stock -= quantity;
    await book.save();
    res.json({ message: 'Stock decreased', stock: book.stock });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
