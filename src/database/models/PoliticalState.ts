import { Schema, model, Document, Model } from 'mongoose';

export interface ICandidate {
  jid: string;
  pushName: string;
  role: 'PRESIDENT' | 'GOVERNOR' | 'HOS';
  groupId: string | null;
  purchasedAt: Date;
  votes: number;
  lastVoteAt: Date | null;
}

export interface IPoliticalState extends Document {
  key: string;
  presidentJid: string | null;
  vicePresidentJid: string | null;
  hosJid: string | null;
  vpUnappointCooldown: Date | null;
  governors: Map<string, string>;
  electionPhase: 'LOCKED' | 'REGISTRATION' | 'VOTING';
  phaseEndsAt: Date | null;
  nextElectionDate: Date;
  candidates: ICandidate[];
}

export interface IPoliticalStateModel extends Model<IPoliticalState> {
  getSystemState(): Promise<IPoliticalState>;
}

const CandidateSchema = new Schema<ICandidate>({
  jid: { type: String, required: true },
  pushName: { type: String, default: 'Anonymous' },
  role: { type: String, required: true, enum: ['PRESIDENT', 'GOVERNOR', 'HOS'] },
  groupId: { type: String, default: null },
  purchasedAt: { type: Date, default: Date.now },
  votes: { type: Number, default: 0 },
  lastVoteAt: { type: Date, default: null }
});

const PoliticalStateSchema = new Schema<IPoliticalState, IPoliticalStateModel>(
  {
    key: { type: String, required: true, unique: true, default: 'GLOBAL_POLITICS' },
    presidentJid: { type: String, default: null },
    vicePresidentJid: { type: String, default: null },
    hosJid: { type: String, default: null },
    vpUnappointCooldown: { type: Date, default: null },
    governors: { type: Map, of: String, default: {} },
    electionPhase: { type: String, enum: ['LOCKED', 'REGISTRATION', 'VOTING'], default: 'LOCKED' },
    phaseEndsAt: { type: Date, default: null },
    nextElectionDate: { type: Date, default: () => new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) },
    candidates: [CandidateSchema]
  },
  { timestamps: true }
);

PoliticalStateSchema.statics.getSystemState = async function () {
  let state = await this.findOne({ key: 'GLOBAL_POLITICS' });
  if (!state) {
    state = await this.create({ key: 'GLOBAL_POLITICS' });
  }
  return state;
};

export const PoliticalState = model<IPoliticalState, IPoliticalStateModel>('PoliticalState', PoliticalStateSchema);
