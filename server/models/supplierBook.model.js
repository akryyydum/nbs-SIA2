const mongoose = require('mongoose');

const supplierBookSchema = new mongoose.Schema({
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  title: { type: String, required: true },
  author: { type: String },
  price: { type: Number, required: true },
  category: { type: String },
  description: { type: String },
  image: { type: String },
  stock: { type: Number, default: 0 },
  // Optionally: add more fields as needed
}, { timestamps: true });

module.exports = mongoose.model('SupplierBook', supplierBookSchema);
