import { Command } from '../types/command';
import { User } from '../database/models/User';

const formatNum = (num: number): string => {
  return num.toLocaleString('en-US');
};

export const leaderboardCommands: Command[] = [
  {
    name: 'leaderboard',
    aliases: ['lb', 'top', 'richest'],
    category: 'economy',
    description: 'Displays the supreme bank reserve hierarchy',
    execute: async (ctx) => {
      const topUsers = await User.find({
        bank: { $lt: Number.MAX_SAFE_INTEGER, $gt: 0 }
      })
      .sort({ bank: -1 })
      .limit(10)
      .exec();

      if (!topUsers || topUsers.length === 0) {
        await ctx.sock.sendMessage(ctx.from, { 
          text: `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n\n🏛️  *𝗙 𝗥 𝗜 𝗢 𝗩 𝗘 𝗥 𝗦 𝗘   𝗩 𝗔 𝗨 𝗟 𝗧 𝗦*\n\nNo eligible accounts detected in the financial registry.` 
        }, { quoted: ctx.msg });
        return;
      }

      let caption = `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n`;
      caption += `🏛️   *𝗙 𝗥 𝗜 𝗢 𝗩 𝗘 𝗥 𝗦 𝗘   𝗥 𝗜 𝗖 𝗛 𝗘 𝗦 𝗧*\n`;
      caption += `*──────── Vault Reserves Ranking ────────*\n\n`;

      for (let i = 0; i < topUsers.length; i++) {
        const u = topUsers[i];
        const rank = i + 1;
        const bankVal = formatNum(u.bank);
        const displayName = u.pushName || 'Anonymous Titan';

        if (rank === 1) {
          caption += `🥇  *─── 𝗡 𝗢 . 𝟭   𝗚 𝗢 𝗟 𝗗 ───*\n`;
          caption += `     ⚜️  *${displayName}*\n`;
          caption += `     🏛️  Bank: *🪙${bankVal}*\n\n`;
        } else if (rank === 2) {
          caption += `🥈  *─── 𝗡 𝗢 . 𝟮   𝗦 𝗜 𝗟 𝗩 𝗘 𝗥 ───*\n`;
          caption += `     ⚔️  *${displayName}*\n`;
          caption += `     🏛️  Bank: *🪙${bankVal}*\n\n`;
        } else if (rank === 3) {
          caption += `🥉  *─── 𝗡 𝗢 . 𝟯   𝗕 𝗥 𝗢 𝗡 𝗭 𝗘 ───*\n`;
          caption += `     🛡️  *${displayName}*\n`;
          caption += `     🏛️  Bank: *🪙${bankVal}*\n\n`;
        } else {
          caption += `*#0${rank}*  │  *${displayName}*\n`;
          caption += `        🏛️  Bank: *🪙${bankVal}*\n\n`;
        }
      }

      caption += `*─────────────────────────*\n`;
      caption += `✨ *Note:* Unlimited reserves are restricted from competition.`;

      const leaderboardImagePath = './assets/lb.jpg';

      try {
        await ctx.sock.sendMessage(ctx.from, {
          image: { url: leaderboardImagePath },
          caption: caption
        }, { quoted: ctx.msg });
      } catch (err) {
        await ctx.sock.sendMessage(ctx.from, {
          text: caption
        }, { quoted: ctx.msg });
      }
    }
  }
];
