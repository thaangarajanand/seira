const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  type: { type: String, enum: ['standard', 'custom'], required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  
  // Standard product relation
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  quantity: { type: Number, default: 1 },

  // Custom request fields
  drawings: [{ type: String }],       // URLs to uploaded drawings
  description: { type: String },

  // Negotiation
  proposedRate: { type: Number },
  proposedDeliveryDate: { type: Date },
  counterNote: { type: String },      // Company's note when changing rate

  // Finalized after acceptance
  finalRate: { type: Number },
  finalDeliveryDate: { type: Date },

  status: {
    type: String,
    enum: ['pending', 'negotiating', 'accepted', 'processing', 'quality_check', 'shipped', 'out_for_delivery', 'completed', 'cancelled', 'payment_failed'],
    default: 'pending'
  },
  negotiationStartedAt: { type: Date },
  cancellationReason: { type: String },
  cancelledBy: { type: String, enum: ['customer', 'company'] },

  // Payment tracking
  paymentId: { type: String },

  // Live location for delivery tracking (updated via Socket.IO)
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    updatedAt: { type: Date }
  },
  completionOTP: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
