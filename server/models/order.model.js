const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [
    {
      book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
      quantity: { type: Number, required: true, min: 1 },
      category: { type: String },
      supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' }
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
      'received'
    ],
    default: 'pending' 
  }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
