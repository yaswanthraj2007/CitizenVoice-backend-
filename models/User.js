const mongoose = require('mongoose');

//----------------------DATABASE schema for user------------------------
const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true, // Prevents two people from registering the exact same email/username
    trim: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', UserSchema);