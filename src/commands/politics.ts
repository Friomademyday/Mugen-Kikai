import fs from 'fs';
import path from 'path';
import { Command } from '../types/command';
import { User } from '../database/models/User';
import { PoliticalState } from '../database/models/PoliticalState';
import { Treasury } from '../database/models/Treasury';

export const politicsCommands: Command[] = [
  
  {
    name: 'hierarchy',
    aliases: ['power', 'leaders', 'government', 'politics'],
    category: 'politics',
    description: 'Displays the current government structure and leadership.',
    execute: async (ctx) => {
      const getNameFromJid = async (jid?: string | null) => {
        if (!jid) return 'Vacant';
        const user = await User.findOne({ where: { jid } });
        return user?.pushName || 'Anonymous Leader';
      };

      const formatCountdown = (targetDate: Date | null | undefined): string => {
        if (!targetDate) return '00d 00h 00m 00s';
        const now = new Date().getTime();
        const diff = targetDate.getTime() - now;

        if (diff <= 0) return '00d 00h 00m 00s';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(days)}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
      };

      const state = await PoliticalState.getSystemState();

      const presidentName = await getNameFromJid(state.presidentJid);
      const vicePresidentName = await getNameFromJid(state.vicePresidentJid);
      const hosName = await getNameFromJid(state.hosJid);

      const localGovJid = state.governors?.get ? state.governors.get(ctx.from) : null;
      const governorName = await getNameFromJid(localGovJid);

      const nextElectionDate = null;
      const countdownStr = formatCountdown(nextElectionDate);

      const caption = 
`⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩
⬩╭────────────╮
⬩                                ╰──────╯⬩
⬩ 𝑫𝒆𝒎𝒐𝒄𝒓𝒂𝒄𝒚 𝒊𝒔 𝒕𝒉𝒆 𝒘𝒐𝒓𝒔𝒕 𝒇𝒐𝒓𝒎 𝒐𝒇
 𝒈𝒐𝒗𝒆𝒓𝒏𝒎𝒆𝒏𝒕 𝒆𝒙𝒄𝒆𝒑𝒕 𝒇𝒐𝒓 𝒂𝒍𝒍 𝒕𝒉𝒆 𝒐𝒕𝒉𝒆𝒓
 𝒇𝒐𝒓𝒎𝒔 𝒕𝒉𝒂𝒕 𝒉𝒂𝒗𝒆 𝒃𝒆𝒆𝒏 𝒕𝒓𝒊𝒆𝒅.     ~_wc_ ⬩

⬩╭─────────────────╮⬩

🏛️  *──────  𝗣 𝗥 𝗘 𝗦 𝗜 𝗗 𝗘 𝗡 𝗧*
      *${presidentName}*

🏛️  *─  𝗩 𝗜 𝗖 𝗘   𝗣 𝗥 𝗘 𝗦 𝗜 𝗗 𝗘 𝗡 𝗧*
(_Appointed by President_)
      *${vicePresidentName}*

🛡️  *──────────── 𝗛 • 𝗢 • 𝗦*
(_Head of Security_)
      *${hosName}*

🏢  *─────── 𝗚 𝗢 𝗩 𝗘 𝗥 𝗡 𝗢 𝗥*
      *${governorName}*

⬩╭────────────╮
⬩                                ╰──────╯⬩
> ⏱️ Next Election:
> ${countdownStr}`;

      const hierarchyImagePath = path.join(process.cwd(), 'assets', 'hierarchy.jpg');

      if (fs.existsSync(hierarchyImagePath)) {
        const imageBuffer = fs.readFileSync(hierarchyImagePath);
        await ctx.sock.sendMessage(ctx.from, {
          image: imageBuffer,
          caption: caption
        }, { quoted: ctx.msg });
      } else {
        await ctx.sock.sendMessage(ctx.from, {
          text: caption
        }, { quoted: ctx.msg });
      }  
    }
  },

  {
    name: 'appoint',
    category: 'politics',
    description: 'Presidential appointment of Vice President',
    execute: async (ctx) => {
      const state = await PoliticalState.getSystemState();

      if (state.presidentJid !== ctx.sender) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Only the active President can use this command!` }, { quoted: ctx.msg });
        return;
      }

      if (state.vpUnappointCooldown && new Date() < state.vpUnappointCooldown) {
        const diff = state.vpUnappointCooldown.getTime() - Date.now();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        await ctx.sock.sendMessage(ctx.from, { text: `⏳ Vice President appointment on cooldown! Wait *${hours}h ${mins}m*.` }, { quoted: ctx.msg });
        return;
      }

      let targetJid: string | null = null;
      if (ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        targetJid = ctx.msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }

      if (!targetJid) {
        await ctx.sock.sendMessage(ctx.from, { text: `Usage: *${ctx.command} @user*` }, { quoted: ctx.msg });
        return;
      }

      if (state.vicePresidentJid === targetJid) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Mentioned user is already Vice President!` }, { quoted: ctx.msg });
        return;
      }

      state.vicePresidentJid = targetJid;
      await state.save();

      await ctx.sock.sendMessage(ctx.from, {
        text: `⬩ 🏛️ 𝗦𝗧𝗔𝗧𝗘 𝗔𝗣𝗣𝗢𝗜𝗡𝗧𝗠𝗘𝗡𝗧\n\n🎖️ *@${targetJid.split('@')[0]}* has been appointed Vice President!`,
        mentions: [targetJid]
      }, { quoted: ctx.msg });
    }
  },

  {
    name: 'unappoint',
    category: 'politics',
    description: 'Dismiss active Vice President with a 15-hour cooldown',
    execute: async (ctx) => {
      const state = await PoliticalState.getSystemState();

      if (state.presidentJid !== ctx.sender) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Only the active President can use this command!` }, { quoted: ctx.msg });
        return;
      }

      if (!state.vicePresidentJid) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ There is no active Vice President to dismiss!` }, { quoted: ctx.msg });
        return;
      }

      const dismissed = state.vicePresidentJid;
      state.vicePresidentJid = null;
      state.vpUnappointCooldown = new Date(Date.now() + 15 * 60 * 60 * 1000);
      await state.save();

      await ctx.sock.sendMessage(ctx.from, {
        text: `⬩ 🏛️ 𝗦𝗧𝗔𝗧𝗘 𝗗𝗜𝗦𝗠𝗜𝗦𝗦𝗔𝗟\n\n🚨 *@${dismissed.split('@')[0]}* was removed from Vice President.\n⏳ 15-Hour Appointment Cooldown Initiated.`,
        mentions: [dismissed]
      }, { quoted: ctx.msg });
    }
  },

  {
    name: 'treasury',
    category: 'politics',
    description: 'Check active official branch treasury balance',
    execute: async (ctx) => {
      const state = await PoliticalState.getSystemState();
      const isGov = state.governors.get(ctx.from) === ctx.sender;
      const isPres = state.presidentJid === ctx.sender || state.vicePresidentJid === ctx.sender;
      const isHos = state.hosJid === ctx.sender;

      if (!isGov && !isPres && !isHos) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Access Denied! State office holders only.` }, { quoted: ctx.msg });
        return;
      }

      let type: 'PRESIDENTIAL' | 'HOS' | 'GOVERNOR' = 'GOVERNOR';
      let groupId: string | null = ctx.from;

      if (isPres) {
        type = 'PRESIDENTIAL';
        groupId = null;
      } else if (isHos) {
        type = 'HOS';
        groupId = null;
      }

      const treasury = await Treasury.getTreasury(type, groupId);
      const official = await User.getOrCreate(ctx.sender);
      const reserve = Math.floor((official.wallet + official.bank) * 0.2);
      const withdrawable = Math.max(0, treasury.balance - reserve);

      await ctx.sock.sendMessage(ctx.from, {
        text: `⬩ 🏛️ 𝗦𝗧𝗔𝗧𝗘 𝗧𝗥𝗘𝗔𝗦𝗨𝗥𝗬\n\n🏛️ Office: *${type}*\n💰 Total Balance: *🪙${treasury.balance.toLocaleString()}*\n🔒 Reserve Lock (20% Net Worth): *🪙${reserve.toLocaleString()}*\n💸 Withdrawable: *🪙${withdrawable.toLocaleString()}*`
      }, { quoted: ctx.msg });
    }
  },

  {
    name: 'treasurywithdraw',
    aliases: ['twith'],
    category: 'politics',
    description: 'Withdraw available funds from state treasury to personal wallet',
    execute: async (ctx) => {
      const state = await PoliticalState.getSystemState();
      const isGov = state.governors.get(ctx.from) === ctx.sender;
      const isPres = state.presidentJid === ctx.sender || state.vicePresidentJid === ctx.sender;
      const isHos = state.hosJid === ctx.sender;

      if (!isGov && !isPres && !isHos) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Access Denied! State office holders only.` }, { quoted: ctx.msg });
        return;
      }

      let type: 'PRESIDENTIAL' | 'HOS' | 'GOVERNOR' = 'GOVERNOR';
      let groupId: string | null = ctx.from;

      if (isPres) {
        type = 'PRESIDENTIAL';
        groupId = null;
      } else if (isHos) {
        type = 'HOS';
        groupId = null;
      }

      const amount = parseInt(ctx.args[0], 10);
      if (isNaN(amount) || amount <= 0) {
        await ctx.sock.sendMessage(ctx.from, { text: `Usage: *${ctx.command} <amount>*` }, { quoted: ctx.msg });
        return;
      }

      const treasury = await Treasury.getTreasury(type, groupId);
      const official = await User.getOrCreate(ctx.sender);
      const reserve = Math.floor((official.wallet + official.bank) * 0.2);
      const withdrawable = Math.max(0, treasury.balance - reserve);

      if (amount > withdrawable) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Exceeds withdrawable limit! Available: *🪙${withdrawable.toLocaleString()}*` }, { quoted: ctx.msg });
        return;
      }

      treasury.balance -= amount;
      official.wallet += amount;

      await treasury.save();
      await official.save();

      await ctx.sock.sendMessage(ctx.from, {
        text: `⬩ 🏛️ 𝗧𝗥𝗘𝗔𝗦𝗨𝗥𝗬 𝗪𝗜𝗧𝗛𝗗𝗥𝗔𝗪𝗔𝗟\n\n💸 Withdrawn: *🪙${amount.toLocaleString()}*\n👛 Wallet: *🪙${official.wallet.toLocaleString()}*\n🏛️ Remaining Treasury: *🪙${treasury.balance.toLocaleString()}*`
      }, { quoted: ctx.msg });
    }
  }
];
