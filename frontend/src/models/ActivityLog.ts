import mongoose, { Schema, Document, Model } from 'mongoose';

export type ActivityAction =
  | 'MODERATOR_CREATED'
  | 'MODERATOR_UPDATED'
  | 'MODERATOR_PERMISSIONS_UPDATED'
  | 'MODERATOR_STATUS_CHANGED'
  | 'MODERATOR_DELETED'
  | 'REVIEW_APPROVED'
  | 'REVIEW_DELETED'
  | 'ORDER_STATUS_CHANGED'
  | 'ORDER_CANCELLED';

export interface IActivityLog extends Document {
  actorId?: string;
  actorEmail: string;
  actorName: string;
  action: ActivityAction | string;
  targetUserId?: string;
  targetUserEmail?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    actorId: { type: String, index: true },
    actorEmail: { type: String, required: true, index: true },
    actorName: { type: String, default: 'Super Admin' },
    action: { type: String, required: true, index: true },
    targetUserId: { type: String, index: true },
    targetUserEmail: { type: String, index: true },
    details: { type: Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityLogSchema.index({ createdAt: -1, action: 1 });

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

export default ActivityLog;

