import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.ATLAS_URI);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;