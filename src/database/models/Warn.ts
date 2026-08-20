import { Schema, model, Document } from 'mongoose';

export interface IWarn extends Document {
  groupJid: string;
  userJid: string;
  warnings: number;
}

const WarnSchema = new Schema<IWarn>(
  {
    groupJid: { type: String, required: true },
    userJid: { type: String, required: true },
    warnings: { type: Number, default: 0 }
  },
  { timestamps: true }
);

WarnSchema.index({ groupJid: 1, userJid: 1 }, { unique: true });

export const WarnModel = model<IWarn>('Warn', WarnSchema);
