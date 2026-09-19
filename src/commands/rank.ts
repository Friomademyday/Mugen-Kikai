import { Command } from '../types/command';
import { User } from '../database/models/User';
import { getCurrentRank, getNextRank, RANK_TIERS } from '../services/rankService';
import fs from 'fs';
import path from 'path';

export const rankCommands: Command[] = [
  {
    name: 'rank',
    aliases: ['level', 'xp'],
    category: 'utility',
    description: 'Check your current rank and universal message progress',
    execute: async (ctx) => {
      const user = await User.getOrCreate(ctx.sender);
      const userXp = user.xp || 0;
      const currentTier = getCurrentRank(userXp);
      const nextTier = getNextRank(userXp);

      const currentRankName = currentTier ? currentTier.japanese : 'Unranked (初心者)';
      const nextRankInfo = nextTier
        ? `${nextTier.japanese} (${nextTier.requiredXp.toLocaleString()} messages)`
        : 'MAX RANK REACHED (無限)';

      const text = 
`⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩
⬩╭────────────╮ 
⬩                                ╰──────╯⬩
⬩ 𝑹𝑨𝑵𝑲:

▬ ⬩ @${ctx.sender.split('@')[0]}
▬ ⬩ ${userXp.toLocaleString()}
▬ ⬩ ${currentRankName}

> Next rank ⬩ ${nextRankInfo}`;

      /*
       * DYNAMIC IMAGE SELECTION FOR .rank COMMAND:
       * If user has a rank tier, load assets/rank{tier.id}.jpg.
       * If unranked (below 50 messages), fallback to assets/rank1.jpg.
      */
      const rankTierId = currentTier ? currentTier.id : 1;
      const imagePath = path.join(process.cwd(), 'assets', `rank${rankTierId}.jpg`);

      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        await ctx.sock.sendMessage(
          ctx.from,
          {
            image: imageBuffer,
            caption: text,
            mentions: [ctx.sender]
          },
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
    category: 'utility',
    description: 'Displays top user message counts universally',
    execute: async (ctx) => {
      const topUsers = await User.find({ xp: { $gt: 0 } })
        .sort({ xp: -1 })
        .limit(5)
        .exec();

      if (!topUsers || topUsers.length === 0) {
        await ctx.sock.sendMessage(
          ctx.from,
          { text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nNo rank records found in registry.` },
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
        const displayName = u.pushName || 'Anonymous Shinobi';
        const tier = getCurrentRank(u.xp || 0);

        const japaneseTitle = tier ? tier.japanese : '初心者 SHOSHINSHA';
        const englishTitle = tier ? tier.name : 'Beginner';

        caption += `*▬▬▬▬▬▬▬ ⬩ ${japaneseTitle}*\n`;
        caption += `❏ \`NAME:\` ${displayName}\n`;
        caption += `❏ \`XP:\` ${xpVal}\n`;
        caption += `❏ \`RANK:\` ${englishTitle}\n\n`;
      }

      caption += `*────────────────────*\n`;
      caption += `> _1xp = 1MSG_`;

      const leaderboardImagePath = path.join(process.cwd(), 'assets', 'ranktop.jpg');

      if (fs.existsSync(leaderboardImagePath)) {
        const imageBuffer = fs.readFileSync(leaderboardImagePath);
        await ctx.sock.sendMessage(
          ctx.from,
          {
            image: imageBuffer,
            caption
          },
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
