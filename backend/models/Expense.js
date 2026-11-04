const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: [
        'FB_ADS',
        'PACKAGING',
        'COURIER',
        'SALARY',
        'OFFICE_RENT',
        'SOFTWARE_SMS',
        'OTHER',
      ],
      default: 'OTHER',
      index: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now, index: true },
    paymentMethod: { type: String, default: 'Cash', trim: true },
    note: { type: String, default: '', trim: true },
    receiptUrl: { type: String, default: '' },
    recordedBy: { type: String, default: 'Admin', trim: true },
  },
  { timestamps: true }
);

ExpenseSchema.index({ date: -1, category: 1 });

module.exports = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);

