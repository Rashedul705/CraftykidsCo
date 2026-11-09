import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICampaign extends Document {
  id: string;
  name: string;
  message: string;
  audienceSegment: string;
  audienceLabel: string;
  recipientCount: number;
  smsPerRecipient: number;
  totalSmsCount: number;
  costPerSms: number;
  totalCost: number;
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed';
  scheduledFor?: string;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  couponCode?: string;
  couponUses: number;
  skipOptOut: boolean;
  skipRecentMarketing7d: boolean;
  skipOpenOrders: boolean;
  createdAt: Date;
  sentAt?: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    message: { type: String, required: true },
    audienceSegment: { type: String, default: 'all' },
    audienceLabel: { type: String, default: 'All Customers' },
    recipientCount: { type: Number, default: 0 },
    smsPerRecipient: { type: Number, default: 1 },
    totalSmsCount: { type: Number, default: 0 },
    costPerSms: { type: Number, default: 0.35 },
    totalCost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'completed', 'failed'],
      default: 'draft',
    },
    scheduledFor: { type: String },
    sentCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    couponCode: { type: String },
    couponUses: { type: Number, default: 0 },
    skipOptOut: { type: Boolean, default: true },
    skipRecentMarketing7d: { type: Boolean, default: true },
    skipOpenOrders: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

export const Campaign: Model<ICampaign> =
  mongoose.models.Campaign || mongoose.model<ICampaign>('Campaign', CampaignSchema);

export default Campaign;

