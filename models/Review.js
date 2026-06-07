const mongoose = require('mongoose');

//----------------------Review schema--------------------------
const ReviewSchema = new mongoose.Schema({
  office: { type: String, required: true },
  district: { type: String, required: true },
  score: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String, default: "" },
  submittedBy: { type: String, default: "Anonymous Citizen" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);