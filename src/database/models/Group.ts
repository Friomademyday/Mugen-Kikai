import { Schema, model, Document } from 'mongoose';

export interface IGroup extends Document {
  jid: string;
  antilink: boolean;
  antistatus: boolean;
  custom01: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GroupSchema = new Schema<IGroup>(
  {
    jid: { type: String, required: true, unique: true, index: true },
    antilink: { type: Boolean, default: false },
    antistatus: { type: Boolean, default: false },
    custom01: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const GroupModel = model<IGroup>('Group', GroupSchema);
