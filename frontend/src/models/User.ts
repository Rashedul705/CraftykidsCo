import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAddress {
  recipientName: string;
  phone: string;
  district: string;
  area?: string;
  streetAddress: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface IUser extends Document {
  phone?: string;
  email?: string;
  name?: string;
  passwordHash?: string;
  role: 'CUSTOMER' | 'ADMIN' | 'PRODUCT_MANAGER' | 'ORDER_HANDLER';
  isActive: boolean;
  otpCode?: string;
  otpExpiresAt?: Date;
  addresses: IAddress[];
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    recipientName: { type: String, required: true },
    phone: { type: String, required: true },
    district: { type: String, required: true },
    area: { type: String },
    streetAddress: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    phone: { type: String, unique: true, sparse: true, index: true },
    email: { type: String, unique: true, sparse: true, index: true },
    name: { type: String },
    passwordHash: { type: String },
    role: {
      type: String,
      enum: ['CUSTOMER', 'ADMIN', 'PRODUCT_MANAGER', 'ORDER_HANDLER'],
      default: 'CUSTOMER',
      index: true,
    },
    isActive: { type: Boolean, default: true },
    otpCode: { type: String },
    otpExpiresAt: { type: Date },
    addresses: [AddressSchema],
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
