// models/Book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  stock: { type: Number, default: 0 },
  image: { type: String }, // URL to book image/cover
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);
