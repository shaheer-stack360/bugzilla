// models/role.model.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const roleSchema = new Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String },
    isSystemRole: { type: Boolean, default: false }    // True for built-in roles like Admin
}, { timestamps: true });

export default mongoose.model('Role', roleSchema);