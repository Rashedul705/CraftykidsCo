import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICategoryAttribute {
  code: string;
  nameBn: string;
  nameEn: string;
  options: { labelBn: string; labelEn: string; value: string }[];
}

export interface ICategory extends Document {
  nameBn: string;
  nameEn: string;
  slug: string;
  parentId?: mongoose.Types.ObjectId | null;
  path: string; // e.g. "/crayons" or "/crayons/toddler" for fast sub-tree queries
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  attributes: ICategoryAttribute[];
  createdAt: Date;
  updatedAt: Date;
}

const CategoryAttributeSchema = new Schema<ICategoryAttribute>(
  {
    code: { type: String, required: true },
    nameBn: { type: String, required: true },
    nameEn: { type: String, required: true },
    options: [
      {
        labelBn: { type: String, required: true },
        labelEn: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
  },
  { _id: false }
);

const CategorySchema = new Schema<ICategory>(
  {
    nameBn: { type: String, required: true },
    nameEn: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    path: { type: String, required: true, index: true },
    description: { type: String },
    imageUrl: { type: String },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true, index: true },
    attributes: [CategoryAttributeSchema],
  },
  { timestamps: true }
);

// Indexes
CategorySchema.index({ path: 1, isActive: 1 });
CategorySchema.index({ parentId: 1, displayOrder: 1 });

export const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
export default Category;
