import { Command } from '../types/command';
import { User } from '../database/models/User';
import { getCurrentRank, getNextRank, RANK_TIERS } from '../services/rankService';

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

      const currentRankName = currentTier ? currentTier.japanese : 'None';
      const nextRankInfo = nextTier
        ? `${nextTier.japanese} (${nextTier.requiredXp.toLocaleString()} messages)`
        : 'MAX RANK REACHED';

      const text = 
`⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩
▬▬▬▬▬ ⬩ 𝑹𝑨𝑵𝑲 𝑷𝑑𝑶𝑭𝑰𝑳𝑬

👤 User: @${ctx.sender.split('@')[0]}
💬 Total Messages (XP): *${userXp.toLocaleString()}*
🎖️ Current Rank: *${currentRankName}*
⏩ Next Rank: *${nextRankInfo}*`;

      await ctx.sock.sendMessage(ctx.from, { text, mentions: [ctx.sender] }, { quoted: ctx.msg });
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
        .limit(10)
        .exec();

      if (!topUsers || topUsers.length === 0) {
        await ctx.sock.sendMessage(
          ctx.from,
          { text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ I⬩\n\nNo rank records found in registry.` },
          { quoted: ctx.msg }
        );
        return;
      }

      let caption = `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩
⬩╭────────────╮
⬩                                ╰──────╯⬩\n`;
      caption += ` *𝑼 𝑵 𝑰 𝑽 𝑬 𝑑 𝑺 𝑨 𝑳   𝑑 𝑨 𝑵  any   𝑳 𝑬 𝑨 𝑫 𝑬 𝑑 𝑞 𝑶 𝑨 𝑑 𝑫*\n`;
      caption += `⬩ ▬▬▬▬▬▬▬▬▬▬▬▬▬ ⬩\n\n`;

      for (let i = 0; i < topUsers.length; i++) {
        const u = topUsers[i];
        const rankNum = i + 1;
        const xpVal = (u.xp || 0).toLocaleString();
        const displayName = u.pushName || 'Anonymous Titan';
        const tier = getCurrentRank(u.xp || 0);
        const rankTitle = tier ? tier.japanese : 'Unranked';

        if (rankNum === 1) {
          caption += `🥇  *──  𝗡 𝗢 . 𝟭   𝗚 𝗢 𝗟 𝗗 ──*\n`;
          caption += `     ⚜️  *${displayName}*\n`;
          caption += `     💬 Messages: *${xpVal}* | Rank: *${rankTitle}*\n\n`;
        } else if (rankNum === 2) {
          caption += `🥈  *──  𝗡 𝗢 . 𝟮   𝗦 𝗜 𝗟 𝗩 𝗘 𝗥 ──*\n`;
          caption += `     ⚔️  *${displayName}*\n`;
          caption += `     💬 Messages: *${xpVal}* | Rank: *${rankTitle}*\n\n`;
        } else if (rankNum === 3) {
          caption += `🥉  *── 𝗡 𝗢 . 𝟯   𝗕 𝗥 𝗢 𝗡 𝗭 𝗘 ──*\n`;
          caption += `     🛡️  *${displayName}*\n`;
          caption += `     💬 Messages: *${xpVal}* | Rank: *${rankTitle}*\n\n`;
        } else {
          caption += `*#0${rankNum}* │ *${displayName}*\n`;
          caption += `        💬 Messages: *${xpVal}* | Rank: *${rankTitle}*\n\n`;
        }
      }

      caption += `*────────────────────*\n`;
      caption += `> ✨ *Note:* Ranking data reflects universal message activity.`;

      await ctx.sock.sendMessage(ctx.from, { text: caption }, { quoted: ctx.msg });
    }
  }
];
