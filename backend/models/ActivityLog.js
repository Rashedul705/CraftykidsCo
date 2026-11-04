const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    actorId: { type: String, index: true },
    actorEmail: { type: String, required: true, index: true },
    actorName: { type: String, default: 'Super Admin' },
    action: { type: String, required: true, index: true },
    targetUserId: { type: String, index: true },
    targetUserEmail: { type: String, index: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activityLogSchema.index({ createdAt: -1, action: 1 });

module.exports =
  mongoose.models.ActivityLog || mongoose.model('ActivityLog', activityLogSchema);

