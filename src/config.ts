import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {

  prefix: process.env.BOT_PREFIX || 'π',
  mongoUri: process.env.MONGO_URI || '',
  ownerNumber: process.env.OWNER_NUMBER || '',
  sessionData: process.env.SESSION_DATA || ''
};
