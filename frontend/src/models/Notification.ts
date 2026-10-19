import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotificationTemplate extends Document {
  event: string; // e.g. "ORDER_PLACED", "ORDER_CONFIRMED", "ORDER_SHIPPED", "OTP_LOGIN"
  templateBn: string;
  templateEn: string;
  channel: 'SMS' | 'EMAIL' | 'WHATSAPP';
}

const NotificationTemplateSchema = new Schema<INotificationTemplate>(
  {
    event: { type: String, required: true, unique: true, index: true },
    templateBn: { type: String, required: true },
    templateEn: { type: String, required: true },
    channel: {
      type: String,
      enum: ['SMS', 'EMAIL', 'WHATSAPP'],
      default: 'SMS',
    },
  },
  { timestamps: false }
);

export const NotificationTemplate: Model<INotificationTemplate> =
  mongoose.models.NotificationTemplate ||
  mongoose.model<INotificationTemplate>(
    'NotificationTemplate',
    NotificationTemplateSchema
  );

export interface INotificationLog extends Document {
  recipient: string; // phone or email
  channel: 'SMS' | 'EMAIL' | 'WHATSAPP';
  event: string;
  message: string;
  status: 'SENT' | 'FAILED';
  responsePayload?: Record<string, unknown>;
  createdAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>(
  {
    recipient: { type: String, required: true, index: true },
    channel: { type: String, required: true },
    event: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['SENT', 'FAILED'], default: 'SENT' },
    responsePayload: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const NotificationLog: Model<INotificationLog> =
  mongoose.models.NotificationLog ||
  mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);
