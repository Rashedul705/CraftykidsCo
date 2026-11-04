import mongoose, { Schema, Document, Model } from 'mongoose';

export type ExpenseCategory =
  | 'FB_ADS'
  | 'PACKAGING'
  | 'COURIER'
  | 'SALARY'
  | 'OFFICE_RENT'
  | 'SOFTWARE_SMS'
  | 'OTHER';

export interface IExpense extends Document {
  title: string;
  category: ExpenseCategory;
  amount: number; // in BDT
  date: Date;
  paymentMethod: string; // 'bKash' | 'Bank' | 'Cash' | 'Card' | 'Nagad'
  note?: string;
  receiptUrl?: string;
  recordedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
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

export const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>('Expense', ExpenseSchema);

export default Expense;

