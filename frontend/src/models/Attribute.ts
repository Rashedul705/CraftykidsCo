import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttributeOption {
  labelBn: string;
  labelEn: string;
  value: string;
}

export interface IAttribute extends Document {
  id?: string;
  code: string;
  nameBn: string;
  nameEn: string;
  type?: string;
  categories: string[]; // ['ALL'] or specific category slugs
  options: IAttributeOption[];
  displayOrder?: number;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttributeOptionSchema = new Schema<IAttributeOption>(
  {
    labelBn: { type: String, required: true },
    labelEn: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const AttributeSchema = new Schema<IAttribute>(
  {
    id: { type: String },
    code: { type: String, required: true, unique: true, index: true },
    nameBn: { type: String, required: true },
    nameEn: { type: String, required: true },
    type: { type: String, default: 'select' },
    categories: [{ type: String, default: 'ALL' }],
    options: [AttributeOptionSchema],
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Attribute: Model<IAttribute> =
  mongoose.models.Attribute || mongoose.model<IAttribute>('Attribute', AttributeSchema);

export default Attribute;
