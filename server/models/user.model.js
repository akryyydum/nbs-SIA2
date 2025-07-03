// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: [
      'customer', 
      'admin', 
      'inventory department', 
      'sales department', 
      'supplier department'
    ], 
    default: 'customer' 
  },
  status: { type: String, enum: ['active', 'pending', 'declined'], default: 'pending' } // <-- default to pending
});

// Hash password before save
userSchema.pre('save', async function(next) {
  // Only hash if password is modified and not already hashed
  if (!this.isModified('password')) return next();

  // Prevent double-hashing if already hashed (bcrypt hashes are 60 chars and start with $2)
  if (typeof this.password === 'string' && this.password.startsWith('$2') && this.password.length === 60) {
    return next();
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Password validation
userSchema.methods.matchPassword = function(password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
