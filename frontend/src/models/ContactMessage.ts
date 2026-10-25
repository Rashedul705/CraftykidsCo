import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IContactMessage extends Document {
  name: string;
  phone: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  replyNote?: string;
  repliedAt?: Date;
  repliedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, index: true },
    subject: { type: String, default: 'সাধারণ জিজ্ঞাসা' },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ['unread', 'read', 'replied'],
      default: 'unread',
      index: true,
    },
    replyNote: { type: String },
    repliedAt: { type: Date },
    repliedBy: { type: String },
  },
  { timestamps: true }
);

ContactMessageSchema.index({ createdAt: -1 });

export const ContactMessage: Model<IContactMessage> =
  mongoose.models.ContactMessage ||
  mongoose.model<IContactMessage>('ContactMessage', ContactMessageSchema);
