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
app.get("/", (req, res) => res.send("Express on Vercel"));

const otpRoutes = require('./routes/otpRoutes');
app.use('/api/auth', otpRoutes);
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', notificationRoutes);

// Middleware
app.use(cors({
  origin: ['https://nbs-sia.vercel.app', 'http://localhost:5173'], // allow Vercel and local dev
  credentials: true,
}));

// Explicit CORS headers for all API routes (for preflight requests)
app.options('/api/*', cors({
  origin: ['https://nbs-sia.vercel.app', 'http://localhost:5173'],
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

// Connect to MongoDB
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    // REMOVE app.listen block for Vercel compatibility
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on http://0.0.0.0:${PORT} (LAN accessible)`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });

// --- Vercel compatibility: export the app ---
module.exports = app;
