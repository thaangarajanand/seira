const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  language: { type: String, default: 'en' },
  translation: { type: String },
  audioUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);
