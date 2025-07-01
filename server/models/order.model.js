const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
      quantity: { type: Number, required: true, min: 1 },
      category: { type: String }, // Added category
      supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' } // Added supplier
    }
  ],
  totalPrice: { type: Number, required: true },
  modeofPayment: {type: String, required: true },
  status: { 
    type: String, 
    enum: [
      'out for delivery',
      'pending',
      'paid',
      'shipped',
      'completed',
      'cancelled',
      'accepted',
      'declined',
      'received' // <-- add this
    ],
    default: 'pending' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
