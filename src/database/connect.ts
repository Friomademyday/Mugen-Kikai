import mongoose from 'mongoose';
import { CONFIG } from '../config';

export const connectDB = async (): Promise<void> => {
  try {
    if (!CONFIG.mongoUri) {
      console.warn('MONGO_URI is not set in environment variables! Database features will not persist.');
      return;
    }

    await mongoose.connect(CONFIG.mongoUri);
    console.log('Successfully connected to MongoDB Atlas!');
  } catch (error) {
    console.error('Failed to connect to MongoDB Atlas:', error);
    process.exit(1);
  }
};
