const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    district: { type: String, required: true },
    area: { type: String },
    streetAddress: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, unique: true, sparse: true, index: true },
    name: { type: String },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: [
        'super_admin',
        'moderator',
        'customer',
        'ADMIN',
        'CUSTOMER',
        'PRODUCT_MANAGER',
        'ORDER_HANDLER',
      ],
      default: 'customer',
      index: true,
    },
    permissions: {
      type: [String],
      default: [],
      index: true,
    },
    isActive: { type: Boolean, default: true, index: true },
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
    addresses: [addressSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model('User', userSchema);

