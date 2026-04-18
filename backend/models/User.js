const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'company', 'admin'], default: 'customer' },
  isApproved: { type: Boolean, default: false }, // Companies need manual approval by admin
  
  // Profile fields
  phone: { type: String },
  address: { type: String },
  bio: { type: String },
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  isSuspended: { type: Boolean, default: false },

  // Cart for persistence
  cart: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    type: { type: String, enum: ['standard', 'custom'], default: 'standard' },
    quantity: { type: Number, default: 1 },
    customData: {
      drawings: [String],
      description: String,
      dimensions: String,
      proposedRate: Number,
      proposedDeliveryDate: Date
    }
  }],

  // Company specific fields
  companyName: { type: String },
  portfolioImages: [{ type: String }],
  completedOrdersCount: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  preferredLanguage: { type: String, default: 'en' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
