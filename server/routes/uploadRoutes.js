const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Upload endpoint
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  // Use a fixed backend IP for the absolute URL
  // Set UPLOAD_BASE_URL in your .env, e.g. UPLOAD_BASE_URL=http://192.168.4.103:5000
  const baseUrl = process.env.UPLOAD_BASE_URL || `${req.protocol}://${req.get('host')}`;
  const filePath = `/uploads/${req.file.filename}`;
  const absoluteUrl = `${baseUrl}${filePath}`;
  res.status(200).json({ url: absoluteUrl });
});

module.exports = router;
