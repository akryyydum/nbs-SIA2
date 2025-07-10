const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');

// Load environment variables
dotenv.config();

const authRoutes = require('./routes/authRoutes');
const bookRoutes = require('./routes/bookRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const userRoutes = require('./routes/userRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const cartRoutes = require('./routes/cartRoutes');
const supplierBookModel = require('./models/supplierBook.model'); // Ensure model is loaded

const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
// server.js or app.js
const otpRoutes = require('./routes/otpRoutes');
app.use('/api/auth', otpRoutes);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://192.168.0.110:5173',
    'http://192.168.9.20:5173',
    'http://192.168.9.17:5173' // <-- Add this line
  ],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' })); // Parse incoming JSON, allow up to 10mb
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // For form data, allow up to 10mb

// Serve static files from the uploads directory for any IP address
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/cart', cartRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT} (LAN accessible)`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
