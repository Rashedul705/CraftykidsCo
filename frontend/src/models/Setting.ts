import mongoose, { Schema, Document, Model } from 'mongoose';

// 1. Setting Model
export interface ISetting extends Document {
  key: string;
  value: string;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, required: true },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

export const Setting: Model<ISetting> =
  mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);

// 2. Activity Log Model
export interface IActivityLog extends Document {
  userId?: mongoose.Types.ObjectId;
  action: string;
  details?: string;
  ipAddress?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', sparse: true, index: true },
    action: { type: String, required: true, index: true },
    details: { type: String },
    ipAddress: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

ActivityLogSchema.index({ action: 1, createdAt: -1 });

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ||
  mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
