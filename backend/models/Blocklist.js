const mongoose = require('mongoose');

const BlocklistSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['PHONE', 'IP'], required: true, default: 'PHONE', index: true },
    value: { type: String, required: true, unique: true, index: true },
    reason: { type: String, default: 'High return risk / Suspicious activity' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

module.exports = mongoose.models.Blocklist || mongoose.model('Blocklist', BlocklistSchema);

