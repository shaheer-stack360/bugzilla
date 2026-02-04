import mongoose from 'mongoose';

const { Schema } = mongoose;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: Schema.Types.ObjectId,  // Reference to Role (single role)
    ref: 'Role',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
  // No _id: false - let MongoDB generate ObjectId automatically
});

export default mongoose.model('User', userSchema);