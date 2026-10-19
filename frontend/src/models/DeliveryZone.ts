import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDeliveryZone extends Document {
  name: string;
  districts: string[]; // List of district names covered
  standardCharge: number; // Integer BDT
  freeDeliveryMinimum?: number; // Integer BDT threshold
  isActive: boolean;
}

const DeliveryZoneSchema = new Schema<IDeliveryZone>(
  {
    name: { type: String, required: true },
    districts: [{ type: String, required: true }],
    standardCharge: { type: Number, required: true },
    freeDeliveryMinimum: { type: Number, default: 1000 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const DeliveryZone: Model<IDeliveryZone> =
  mongoose.models.DeliveryZone ||
  mongoose.model<IDeliveryZone>('DeliveryZone', DeliveryZoneSchema);
export default DeliveryZone;
