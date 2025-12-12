const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    set: v => typeof v === 'string' ? v.toLowerCase() : v
  },
  name: { type: String, required: true, trim: true, minlength: 2 },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email']
  },
  password: { type: String, required: true, minlength: 6 }, // bcrypt hash
  createdAt: { type: Date, default: Date.now }
});

// Used to Remove sensitive fields when converting to JSON
if (!userSchema.options.toJSON) userSchema.options.toJSON = {};
userSchema.options.toJSON.transform = function (doc, ret) {
  delete ret.password;
  delete ret.__v;
  return ret;
};

module.exports = mongoose.model('User', userSchema);
