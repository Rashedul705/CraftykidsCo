import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IGiftItem extends Document {
  name: string;
  image: string;
  price: number;
  stock: number;
  categoryId: string;
  categoryName: string;
  showInSuggestions: boolean;
  isCompulsory: boolean;
  suggestionMessage: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const GiftItemSchema = new Schema<IGiftItem>(
  {
    name: { type: String, required: true, trim: true },
    image: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    categoryId: { type: String, required: true, index: true },
    categoryName: { type: String, default: '' },
    showInSuggestions: { type: Boolean, default: false, index: true },
    isCompulsory: { type: Boolean, default: false, index: true },
    suggestionMessage: { type: String, default: '' },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== 'production' && mongoose.models && (mongoose.models as any).GiftItem) {
  delete (mongoose.models as any).GiftItem;
}

export const GiftItem: Model<IGiftItem> =
  mongoose.models.GiftItem || mongoose.model<IGiftItem>('GiftItem', GiftItemSchema);

