import { Schema, model, Document, Model } from 'mongoose';

export interface IUser extends Document {
  jid: string;
  pushName?: string;
  xp: number;
  classType: 'Knight' | 'Sorcerer' | 'Lord of Summons' | 'Vessel of Faith' | 'None';
  stamina: number;
  mana: number;
  bond: number;
  faith: number;
  isGodhood: boolean;
  wallet: number;
  bank: number;
  lastDaily: Date | null;
  custom01: any;
  custom02: any;
  custom03: any;
  custom04: any;
  custom05: any;
  custom06: any;
  custom07: any;
  custom08: any;
  custom09: any;
  custom10: any;
  custom11: any;
  custom12: any;
  custom13: any;
  custom14: any;
  custom15: any;
  custom16: any;
  custom17: any;
  custom18: any;
  custom19: any;
  custom20: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserModel extends Model<IUser> {
  getOrCreate(jid: string, pushName?: string): Promise<IUser>;
}

const UserSchema = new Schema<IUser, IUserModel>(
  {
    jid: { type: String, required: true, unique: true, index: true },
    pushName: { type: String, default: 'Anonymous Titan' },
    xp: { type: Number, default: 0 },
    classType: { 
      type: String, 
      enum: ['Knight', 'Sorcerer', 'Lord of Summons', 'Vessel of Faith', 'None'], 
      default: 'None' 
    },
    stamina: { type: Number, default: 100 },
    mana: { type: Number, default: 100 },
    bond: { type: Number, default: 0 },
    faith: { type: Number, default: 0 },
    isGodhood: { type: Boolean, default: false },
    wallet: { type: Number, default: 1000 },
    bank: { type: Number, default: 0 },
    lastDaily: { type: Date, default: null },
    custom01: { type: Schema.Types.Mixed, default: null },
    custom02: { type: Schema.Types.Mixed, default: null },
    custom03: { type: Schema.Types.Mixed, default: null },
    custom04: { type: Schema.Types.Mixed, default: null },
    custom05: { type: Schema.Types.Mixed, default: null },
    custom06: { type: Schema.Types.Mixed, default: null },
    custom07: { type: Schema.Types.Mixed, default: null },
    custom08: { type: Schema.Types.Mixed, default: null },
    custom09: { type: Schema.Types.Mixed, default: null },
    custom10: { type: Schema.Types.Mixed, default: null },
    custom11: { type: Schema.Types.Mixed, default: null },
    custom12: { type: Schema.Types.Mixed, default: null },
    custom13: { type: Schema.Types.Mixed, default: null },
    custom14: { type: Schema.Types.Mixed, default: null },
    custom15: { type: Schema.Types.Mixed, default: null },
    custom16: { type: Schema.Types.Mixed, default: null },
    custom17: { type: Schema.Types.Mixed, default: null },
    custom18: { type: Schema.Types.Mixed, default: null },
    custom19: { type: Schema.Types.Mixed, default: null },
    custom20: { type: Schema.Types.Mixed, default: null }
  },
  { timestamps: true }
);

UserSchema.statics.getOrCreate = async function (jid: string, pushName?: string) {
  let user = await this.findOne({ jid });
  if (!user) {
    user = await this.create({ jid, pushName: pushName || 'Anonymous Titan' });
  } else if (pushName && user.pushName !== pushName) {
    user.pushName = pushName;
    await user.save();
  }
  return user;
};

export const User = model<IUser, IUserModel>('User', UserSchema);
