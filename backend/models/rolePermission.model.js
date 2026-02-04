// models/rolePermission.model.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const rolePermissionSchema = new Schema({
  role: { 
    type: Schema.Types.ObjectId, 
    ref: 'Role',
    required: true 
  },
  permission: { 
    type: Schema.Types.ObjectId, 
    ref: 'Permission',
    required: true 
  }
}, { 
  timestamps: true ,   collection: 'role_permissions'  // <-- ADD THIS LINE
});

// Create compound index to prevent duplicate role-permission pairs
rolePermissionSchema.index({ role: 1, permission: 1 }, { unique: true });

export default mongoose.model('RolePermission', rolePermissionSchema);