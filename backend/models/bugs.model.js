import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const bugsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  expected_behavior: { type: String, required: true },
  actual_behavior: { type: String, required: true },
  attachments: [{ type: String }],
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Reopened'],
    default: 'Open'
  },
  reported_by: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // ✅ Denormalized — set once at creation, never changes
  reported_by_name: { type: String, default: '' },

  assigned_to: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // ✅ Denormalized — updated on assign/unassign
  assigned_to_name: { type: String, default: '' },

}, { timestamps: true });

/* Indexes */
bugsSchema.index({ status: 1, priority: 1 });
bugsSchema.index({ assigned_to: 1 });
bugsSchema.index({ reported_by: 1 });
bugsSchema.index({ createdAt: -1 });
bugsSchema.index({ updatedAt: -1 });
bugsSchema.index({ title: 'text', description: 'text' });

const Bug = mongoose.model('Bug', bugsSchema);

export default Bug;