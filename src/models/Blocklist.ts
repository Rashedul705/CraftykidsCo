import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBlocklist extends Document {
  type: 'PHONE' | 'IP';
  value: string;
  reason?: string;
  createdAt: Date;
}

const BlocklistSchema = new Schema<IBlocklist>(
  {
    type: { type: String, enum: ['PHONE', 'IP'], required: true, index: true },
    value: { type: String, required: true, unique: true, index: true },
    reason: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const Blocklist: Model<IBlocklist> =
  mongoose.models.Blocklist || mongoose.model<IBlocklist>('Blocklist', BlocklistSchema);
export default Blocklist;
