const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  stock: { type: Number, default: 10 },
  minOrderQuantity: { type: Number, default: 1 },
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
