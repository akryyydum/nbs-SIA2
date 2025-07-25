// server/routes/otpRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// TEMPORARY IN-MEMORY STORE — replace with Redis for production
const otpStore = {}; // email -> { otp, expiresAt }

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Add a body parser middleware to ensure req.body is populated
router.use(express.json());

// Send OTP to email (for registration or reset)
router.post('/send-otp', async (req, res) => {
  const { email, purpose } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Email not found' });

  const otp = crypto.randomInt(100000, 999999).toString();
  otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 }; // 5 min

  let subject, text;
  if (purpose === 'register') {
    subject = 'NBS Registration OTP';
    text = `Welcome to National Book Store!\n\nYour registration OTP is ${otp}. It will expire in 5 minutes.`;
  } else {
    subject = 'Password Reset OTP';
    text = `Your OTP is ${otp}. It will expire in 5 minutes.`;
  }

  try {
    await transporter.sendMail({
      from: `"NBS Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      text,
    });

    res.json({ message: 'OTP sent' });
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
});

// Reset password using OTP
router.post('/reset-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const record = otpStore[email];
  if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    delete otpStore[email];
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Activate user after OTP verification
router.post('/activate', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.status !== 'pending') {
    return res.status(400).json({ message: 'User is not pending activation' });
  }
  user.status = 'active';
  await user.save();
  res.json({ message: 'Account activated' });
});

// Verify OTP for registration (customer)
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];
  if (!record || record.otp !== otp || Date.now() > record.expiresAt) {
    return res.status(400).json({ message: 'Invalid or expired OTP' });
  }
  // Activate customer if status is pending
  const user = await User.findOne({ email });
  if (user && user.role === 'customer' && user.status === 'pending') {
    user.status = 'active';
    await user.save();
  }
  delete otpStore[email];
  res.json({ message: 'OTP verified' });
});

// Add a route to check if email exists in the system
router.post('/check-email', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'Email not found' });
  res.json({ message: 'Email exists' });
});

module.exports = router;
