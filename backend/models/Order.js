const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  id: { type: String },
  productId: { type: String, required: true },
  title: { type: String, required: true },
  variationTitle: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
  total: { type: Number, required: true }
}, { _id: false });

const timelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  timestamp: { type: String, required: true },
  note: { type: String }
}, { _id: false });

const callLogSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['PENDING', 'CONNECTED', 'NOT_ANSWERED', 'BUSY', 'UNREACHABLE', 'CALL_LATER'],
    default: 'PENDING'
  },
  note: { type: String, default: '' },
  calledBy: { type: String, default: 'Admin' },
  calledAt: { type: String, default: () => new Date().toISOString() }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  orderNumber: { type: String, required: true, unique: true, index: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true, index: true },
  district: { type: String, required: true },
  fullAddress: { type: String, required: true },
  customerNote: { type: String },
  subtotal: { type: Number, required: true },
  deliveryCharge: { type: Number, default: 60 },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  couponCode: { type: String },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
    default: 'PENDING',
    index: true
  },
  paymentStatus: {
    type: String,
    enum: ['UNPAID', 'PAID'],
    default: 'UNPAID'
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'BKASH', 'NAGAD'],
    default: 'COD'
  },
  courier: { type: String },
  consignmentId: { type: String },
  trackingCode: { type: String },
  internalNote: { type: String },
  callStatus: {
    type: String,
    enum: ['PENDING', 'CONNECTED', 'NOT_ANSWERED', 'BUSY', 'UNREACHABLE', 'CALL_LATER'],
    default: 'PENDING'
  },
  callLogs: [callLogSchema],
  items: [orderItemSchema],
  timeline: [timelineSchema]
}, {
  timestamps: true
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
