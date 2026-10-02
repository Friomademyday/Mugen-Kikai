import { WASocket, WAMessage } from '@whiskeysockets/baileys';
import { User, IUser } from '../database/models/User';
import fs from 'fs';
import path from 'path';

export interface RankTier {
  id: number;
  name: string;
  japanese: string;
  requiredXp: number;
  bonus: number;
}

export const RANK_TIERS: RankTier[] = [
  { id: 1, name: 'Beginner', japanese: '初心者 - SHOSHINSHA', requiredXp: 10, bonus: 50000 },
  { id: 2, name: 'Rookie', japanese: '新人 - SHINJIN', requiredXp: 30, bonus: 100000 },
  { id: 3, name: 'Regular', japanese: '常連 - JŌREN', requiredXp: 70, bonus: 250000 },
  { id: 4, name: 'Veteran', japanese: '熟練者 - JUKUREN-SHA', requiredXp: 150, bonus: 500000 },
  { id: 5, name: 'Adept', japanese: '達人 - TATSUJIN', requiredXp: 300, bonus: 1000000 },
  { id: 6, name: 'Master', japanese: '師範 - SHIHAN', requiredXp: 600, bonus: 5000000 },
  { id: 7, name: 'Saint', japanese: '聖者 - SEIJA', requiredXp: 1000, bonus: 10000000 },
  { id: 8, name: 'Demigod', japanese: '半神 - HANSHIN', requiredXp: 2000, bonus: 50000000 },
  { id: 9, name: 'Godlike', japanese: '神格 - SHINKAKU', requiredXp: 4000, bonus: 100000000 },
  { id: 10, name: 'Infinite', japanese: '無限 - MUGEN', requiredXp: 10000, bonus: 500000000 }
];

export function getCurrentRank(xp: number): RankTier | null {
  let current: RankTier | null = null;
  for (const tier of RANK_TIERS) {
    if (xp >= tier.requiredXp) {
      current = tier;
    } else {
      break;
    }
  }
  return current;
}

export function getNextRank(xp: number): RankTier | null {
  for (const tier of RANK_TIERS) {
    if (xp < tier.requiredXp) {
      return tier;
    }
  }
  return null;
}

export async function addDuelWinAndCheckRank(
  winnerJid: string,
  fromJid: string,
  sock: WASocket
): Promise<void> {
  const user = await User.getOrCreate(winnerJid);
  user.xp = (user.xp || 0) + 2;

  const currentRankTier = getCurrentRank(user.xp);
  const lastProcessedRankId = typeof user.custom04 === 'number' ? user.custom04 : 0;

  if (currentRankTier && currentRankTier.id > lastProcessedRankId) {
    const oldRankTier = RANK_TIERS.find((t) => t.id === lastProcessedRankId);
    const oldRankText = oldRankTier ? oldRankTier.japanese : 'None';

    user.custom04 = currentRankTier.id;
    user.wallet += currentRankTier.bonus;
    await user.save();

    const nextRankTier = getNextRank(user.xp);
    const nextRankText = nextRankTier
      ? `${nextRankTier.japanese} (${nextRankTier.requiredXp.toLocaleString()} XP)`
      : 'MAX RANK (無限)';

    const senderTag = `@${winnerJid.split('@')[0]}`;

    const announcementText =
`⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩
⬩╭────────────╮ 
⬩                                ╰──────╯⬩
▬▬▬ ⬩ ${user.xp.toLocaleString()} COMBAT XP 
⬩    𝑵𝑬𝑾 𝑹𝑨𝑵𝑲: ${currentRankTier.japanese}    ⬩

▬ ⬩ ${senderTag}
▬ ⬩ ${oldRankText}
▬ ⬩ ${currentRankTier.japanese}
▬ ⬩ REWARD: + 🪙${currentRankTier.bonus.toLocaleString()}

Next Rank ⬩ ${nextRankText}`;

    const rankImagePath = path.join(process.cwd(), 'assets', `rank${currentRankTier.id}.jpg`);

    if (fs.existsSync(rankImagePath)) {
      const imageBuffer = fs.readFileSync(rankImagePath);
      await sock.sendMessage(
        fromJid,
        {
          image: imageBuffer,
          caption: announcementText,
          mentions: [winnerJid]
        }
      );
    } else {
      await sock.sendMessage(
        fromJid,
        {
          text: announcementText,
          mentions: [winnerJid]
        }
      );
    }
  } else {
    await user.save();
  }
}
