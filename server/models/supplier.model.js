const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  contactPerson: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  productCategories: [{ type: String }],
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', supplierSchema);
