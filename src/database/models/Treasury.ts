import { Schema, model, Document, Model } from 'mongoose';

export interface ITreasury extends Document {
  type: 'PRESIDENTIAL' | 'HOS' | 'GOVERNOR';
  groupId: string | null;
  balance: number;
}

export interface ITreasuryModel extends Model<ITreasury> {
  getTreasury(type: 'PRESIDENTIAL' | 'HOS' | 'GOVERNOR', groupId?: string | null): Promise<ITreasury>;
}

const TreasurySchema = new Schema<ITreasury, ITreasuryModel>(
  {
    type: { type: String, required: true, enum: ['PRESIDENTIAL', 'HOS', 'GOVERNOR'] },
    groupId: { type: String, default: null },
    balance: { type: Number, default: 0 }
  },
  { timestamps: true }
);

TreasurySchema.index({ type: 1, groupId: 1 }, { unique: true });

TreasurySchema.statics.getTreasury = async function (type: 'PRESIDENTIAL' | 'HOS' | 'GOVERNOR', groupId: string | null = null) {
  let treasury = await this.findOne({ type, groupId });
  if (!treasury) {
    treasury = await this.create({ type, groupId, balance: 0 });
  }
  return treasury;
};

export const Treasury = model<ITreasury, ITreasuryModel>('Treasury', TreasurySchema);
