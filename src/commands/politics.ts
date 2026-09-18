import { Command } from '../types/command';
import { User } from '../database/models/User';
import { PoliticalState } from '../database/models/PoliticalState';
import { Treasury } from '../database/models/Treasury';

export const politicsCommands: Command[] = [
  {
    name: 'hierarchy',
    aliases: ['politics', 'government'],
    category: 'politics',
    description: 'Display active state officials and governors',
    execute: async (ctx) => {
      const state = await PoliticalState.getSystemState();

      const pres = state.presidentJid ? `@${state.presidentJid.split('@')[0]}` : 'Vacant';
      const vp = state.vicePresidentJid ? `@${state.vicePresidentJid.split('@')[0]}` : 'Vacant';
      const hos = state.hosJid ? `@${state.hosJid.split('@')[0]}` : 'Vacant';

      const govJid = state.governors.get(ctx.from);
      const gov = govJid ? `@${govJid.split('@')[0]}` : 'Vacant';

      const text = `⬩ 🏛️ 𝗣𝗢𝗟𝗜𝗧𝗜𝗖𝗔𝗟 𝗛𝗜𝗘𝗥𝗔𝗥𝗖𝗛𝗬\n\n👑 President: ${pres}\n🎖️ Vice President: ${vp}\n🛡️ Head of Security: ${hos}\n\n🏛️ Local Governor: ${gov}`;
      const mentions = [state.presidentJid, state.vicePresidentJid, state.hosJid, govJid].filter(Boolean) as string[];

      await ctx.sock.sendMessage(ctx.from, { text, mentions }, { quoted: ctx.msg });
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
