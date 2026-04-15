const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
