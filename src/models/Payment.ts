import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  provider: 'COD' | 'BKASH' | 'NAGAD' | 'CARD';
  transactionId?: string;
  amount: number; // Integer BDT
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  rawResponse?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    orderNumber: { type: String, required: true },
    provider: {
      type: String,
      enum: ['COD', 'BKASH', 'NAGAD', 'CARD'],
      required: true,
      index: true,
    },
    transactionId: { type: String, sparse: true, index: true },
    amount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'PENDING',
      index: true,
    },
    rawResponse: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;
