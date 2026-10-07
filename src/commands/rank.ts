import { CommandContext } from '../index';
import { User } from '../database/models/User';
import { getCurrentRank, getNextRank } from '../services/rankService';
import fs from 'fs';
import path from 'path';

export const rankCommands = [
  {
    name: 'rank',
    aliases: ['level', 'xp'],
    description: 'Check your combat rank and duel wins',
    execute: async (ctx: CommandContext) => {
      const user = await User.getOrCreate(ctx.sender);
      const userXp = user.xp || 0;
      const currentTier = getCurrentRank(userXp);
      const nextTier = getNextRank(userXp);

      const currentRankName = currentTier ? currentTier.japanese : 'Unranked (初心者)';
      const nextRankInfo = nextTier
        ? `${nextTier.japanese} (${nextTier.requiredXp.toLocaleString()} XP)`
        : 'MAX RANK REACHED (無限)';

      const totalWins = Math.floor(userXp / 2);

      const text =
`⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩
⬩╭────────────╮ 
⬩                                ╰──────╯⬩

⬩ 𝑹𝑨𝑵𝑲:

▬ ⬩ @${ctx.sender.split('@')[0]}
▬ ⬩ ${userXp.toLocaleString()} COMBAT XP
▬ ⬩ ${totalWins.toLocaleString()} DUEL WINS
▬ ⬩ ${currentRankName}

> Next Rank ⬩ ${nextRankInfo}`;

      const rankTierId = currentTier ? currentTier.id : 1;
      const imagePath = path.join(process.cwd(), 'assets', `rank${rankTierId}.jpg`);

      if (fs.existsSync(imagePath)) {
        await ctx.sock.sendMessage(
          ctx.from,
          { image: fs.readFileSync(imagePath), caption: text, mentions: [ctx.sender] },
          { quoted: ctx.msg }
        );
      } else {
        await ctx.sock.sendMessage(
          ctx.from,
          { text, mentions: [ctx.sender] },
          { quoted: ctx.msg }
        );
      }
    }
  },

  {
    name: 'rankleaderboard',
    aliases: ['ranktop', 'xptop'],
    description: 'Displays top duelists based on Combat XP',
    execute: async (ctx: CommandContext) => {
      const topUsers = await User.find({ xp: { $gt: 0 } })
        .sort({ xp: -1 })
        .limit(5)
        .exec();

      if (!topUsers || topUsers.length === 0) {
        await ctx.sock.sendMessage(
          ctx.from,
          { text: '⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nNo combat records found in registry.' },
          { quoted: ctx.msg }
        );
        return;
      }

      let caption = `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n`;
      caption += `⬩╭────────────╮ 
⬩                                ╰──────╯⬩\n`;
      caption += `⬩        Ｒ Ａ Ｎ Ｋ Ｉ Ｎ Ｇ Ｓ        ⬩\n\n`;

      for (let i = 0; i < topUsers.length; i++) {
        const u = topUsers[i];
        const xpVal = (u.xp || 0).toLocaleString();
        const wins = Math.floor((u.xp || 0) / 2);
        const displayName = u.pushName || 'Anonymous Shinobi';
        const tier = getCurrentRank(u.xp || 0);

        const japaneseTitle = tier ? tier.japanese : '初心者 SHOSHINSHA';
        const englishTitle = tier ? tier.name : 'Beginner';

        caption += `*▬▬▬▬▬▬▬ ⬩ ${japaneseTitle}*\n`;
        caption += `❏ NAME: ${displayName}\n`;
        caption += `❏ COMBAT XP: ${xpVal} (${wins} Wins)\n`;
        caption += `❏ RANK: ${englishTitle}\n\n`;
      }

      caption += `*────────────────────*\n`;
      caption += `> _1 WIN = +2 COMBAT XP_`;

      const leaderboardImagePath = path.join(process.cwd(), 'assets', 'ranktop.jpg');

      if (fs.existsSync(leaderboardImagePath)) {
        await ctx.sock.sendMessage(
          ctx.from,
          { image: fs.readFileSync(leaderboardImagePath), caption },
          { quoted: ctx.msg }
        );
      } else {
        await ctx.sock.sendMessage(
          ctx.from,
          { text: caption },
          { quoted: ctx.msg }
        );
      }
    }
  }
];
