import mongoose from 'mongoose';

const Schema = mongoose.Schema;


const permissionSchema = new Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  description: { 
    type: String 
  },
}, { timestamps: true});

export default mongoose.model('Permission', permissionSchema);