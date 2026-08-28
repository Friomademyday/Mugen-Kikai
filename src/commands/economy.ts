import { Command } from '../types/command';
import { User } from '../database/models/User';

const getTargetJid = (ctx: any): string | null => {
  if (ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
    return ctx.msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
  }
  if (ctx.msg.message?.extendedTextMessage?.contextInfo?.participant) {
    return ctx.msg.message.extendedTextMessage.contextInfo.participant;
  }
  return null;
};

export const economyCommands: Command[] = [
  {
    name: 'firstclaim',
    category: 'economy',
    description: 'Claim your initial starter bonus',
    execute: async (ctx) => {
      const user = await User.getOrCreate(ctx.sender);
      
      if (user.custom01) {
        await ctx.sock.sendMessage(ctx.from, { 
          text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗘 𝗖 𝗢 𝗡 𝗢 𝗠 𝗬\n\n❌ You have already claimed your starter pack!\nUse *${ctx.command} daily* to get regular income.` 
        }, { quoted: ctx.msg });
        return;
      }

      const bonus = Math.floor(Math.random() * (75000 - 24000 + 1)) + 24000;
      user.wallet += bonus;
      user.custom01 = true;
      await user.save();

      await ctx.sock.sendMessage(ctx.from, {
        text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗘 𝗖 𝗢 𝗡 𝗢 𝗠 𝗬\n\n🎉 *STARTER PACK CLAIMED!*\n\n Added: *+🪙${bonus.toLocaleString()}*\n👛 Wallet Balance: *🪙${user.wallet.toLocaleString()}*`
      }, { quoted: ctx.msg });
    }
  },

  {
    name: 'claim',
    aliases: ['daily'],
    category: 'economy',
    description: 'Claim your daily allowance',
    execute: async (ctx) => {
      const user = await User.getOrCreate(ctx.sender);
      const now = new Date();
      
      if (user.lastDaily) {
        const nextClaim = new Date(user.lastDaily.getTime() + 24 * 60 * 60 * 1000);
        if (now < nextClaim) {
          const diffMs = nextClaim.getTime() - now.getTime();
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          await ctx.sock.sendMessage(ctx.from, {
            text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗘 𝗖 𝗢 𝗡 𝗢 𝗠 𝗬\n\n⏳ You are still on cooldown!\nCome back in *${hours}h ${mins}m*.`
          }, { quoted: ctx.msg });
          return;
        }
      }

      const reward = 2500;
      user.wallet += reward;
      user.lastDaily = now;
      await user.save();

      await ctx.sock.sendMessage(ctx.from, {
        text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗘 𝗖 𝗢 𝗡 𝗢 𝗠 𝗬\n\n☀️ *DAILY ALLOWANCE*\n\n Reward: *+🪙${reward.toLocaleString()}*\n👛 Wallet Balance: *🪙${user.wallet.toLocaleString()}*`
      }, { quoted: ctx.msg });
    }
  },

  {
    name: 'wallet',
    aliases: ['bal', 'balance'],
    category: 'economy',
    description: 'Check current financial state',
    execute: async (ctx) => {
      const user = await User.getOrCreate(ctx.sender);
      const total = user.wallet + user.bank;

      await ctx.sock.sendMessage(ctx.from, {
        text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗘 𝗖 𝗢 𝗡 𝗢 𝗠 𝗬\n\n💳 *FINANCIAL STATEMENT*\n\n👛 Wallet: *🪙${user.wallet.toLocaleString()}*\n🏛️ Bank: *🪙${user.bank.toLocaleString()}*\n💎 Net Worth: *🪙${total.toLocaleString()}*`
      }, { quoted: ctx.msg });
    }
  },

  {
    name: 'deposit',
    aliases: ['dep'],
    category: 'economy',
    description: 'Deposit wallet funds to bank',
    execute: async (ctx) => {
      const user = await User.getOrCreate(ctx.sender);
      const amountStr = ctx.args[0]?.toLowerCase();

      if (!amountStr) {
        await ctx.sock.sendMessage(ctx.from, { text: `Specify an amount or use *all*.` }, { quoted: ctx.msg });
        return;
      }

      let amount = 0;
      if (amountStr === 'all') {
        amount = user.wallet;
      } else {
        amount = parseInt(amountStr, 10);
      }

      if (isNaN(amount) || amount <= 0) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Invalid deposit amount.` }, { quoted: ctx.msg });
        return;
      }

      if (user.wallet < amount) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Insufficient wallet cash!` }, { quoted: ctx.msg });
        return;
      }

      user.wallet -= amount;
      user.bank += amount;
      await user.save();

      await ctx.sock.sendMessage(ctx.from, {
        text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗘 𝗖 𝗢 𝗡 𝗢 𝗠 𝗬\n\n🏛️ *BANK DEPOSIT*\n\n📥 Deposited: *🪙${amount.toLocaleString()}*\n👛 Wallet: *🪙${user.wallet.toLocaleString()}*\n🏦 Bank: *🪙${user.bank.toLocaleString()}*`
      }, { quoted: ctx.msg });
    }
  },

  {
    name: 'withdraw',
    aliases: ['with'],
    category: 'economy',
    description: 'Withdraw bank funds to wallet',
    execute: async (ctx) => {
      const user = await User.getOrCreate(ctx.sender);
      const amountStr = ctx.args[0]?.toLowerCase();

      if (!amountStr) {
        await ctx.sock.sendMessage(ctx.from, { text: `Specify an amount or use *all*.` }, { quoted: ctx.msg });
        return;
      }

      let amount = 0;
      if (amountStr === 'all') {
        amount = user.bank;
      } else {
        amount = parseInt(amountStr, 10);
      }

      if (isNaN(amount) || amount <= 0) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Invalid withdrawal amount.` }, { quoted: ctx.msg });
        return;
      }

      if (user.bank < amount) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Insufficient bank balance!` }, { quoted: ctx.msg });
        return;
      }

      user.bank -= amount;
      user.wallet += amount;
      await user.save();

      await ctx.sock.sendMessage(ctx.from, {
        text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗘 𝗖 𝗢 𝗡 𝗢 𝗠 𝗬\n\n📤 *BANK WITHDRAWAL*\n\n💸 Withdrawn: *🪙${amount.toLocaleString()}*\n👛 Wallet: *🪙${user.wallet.toLocaleString()}*\n🏦 Bank: *🪙${user.bank.toLocaleString()}*`
      }, { quoted: ctx.msg });
    }
  },

  {
    name: 'give',
    aliases: ['pay', 'transfer'],
    category: 'economy',
    description: 'Transfer cash to a target user',
    execute: async (ctx) => {
      const senderUser = await User.getOrCreate(ctx.sender);
      const targetJid = getTargetJid(ctx);

      if (!targetJid) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Mention or reply to the user you want to pay!` }, { quoted: ctx.msg });
        return;
      }

      if (targetJid === ctx.sender) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ You cannot transfer money to yourself!` }, { quoted: ctx.msg });
        return;
      }

      const amount = parseInt(ctx.args[0], 10) || parseInt(ctx.args[1], 10);
      if (isNaN(amount) || amount <= 0) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Enter a valid transfer amount.` }, { quoted: ctx.msg });
        return;
      }

      if (senderUser.wallet < amount) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Insufficient wallet balance!` }, { quoted: ctx.msg });
        return;
      }

      const targetUser = await User.getOrCreate(targetJid);
      senderUser.wallet -= amount;
      targetUser.wallet += amount;

      await senderUser.save();
      await targetUser.save();

      await ctx.sock.sendMessage(ctx.from, {
        text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗘 𝗖 𝗢 𝗡 𝗢 𝗠 𝗬\n\n💸 *TRANSFER EXECUTED*\n\n📤 Sent: *🪙${amount.toLocaleString()}*\n👤 Recipient: @${targetJid.split('@')[0]}`,
        mentions: [targetJid]
      }, { quoted: ctx.msg });
    }
  },

  {
    name: 'rob',
    category: 'economy',
    description: 'Attempt standard robbery',
    execute: async (ctx) => {
      const robber = await User.getOrCreate(ctx.sender);
      const victimJid = getTargetJid(ctx);

      if (!victimJid) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Mention or reply to the victim you want to rob!` }, { quoted: ctx.msg });
        return;
      }

      if (victimJid === ctx.sender) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ You cannot rob yourself!` }, { quoted: ctx.msg });
        return;
      }

      const victim = await User.getOrCreate(victimJid);

      if (victim.wallet < 1000) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Target is too broke to rob! (Requires min 🪙1,000 in wallet)` }, { quoted: ctx.msg });
        return;
      }

      if (robber.wallet < 500) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ You need at least 🪙500 in your wallet to risk a robbery!` }, { quoted: ctx.msg });
        return;
      }

      const success = Math.random() < 0.24;

      if (success) {
        const percent = (Math.floor(Math.random() * 31) + 10) / 100;
        const stolen = Math.floor(victim.wallet * percent);

        victim.wallet -= stolen;
        robber.wallet += stolen;

        await victim.save();
        await robber.save();

        await ctx.sock.sendMessage(ctx.from, {
          text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗘 𝗖 𝗢 𝗡 𝗢 𝗠 𝗬\n\n🗡️ *ROBBERY SUCCESSFUL*\n\n💰 Stolen: *🪙${stolen.toLocaleString()}*\n👤 Target: @${victimJid.split('@')[0]}`,
          mentions: [victimJid]
        }, { quoted: ctx.msg });
      } else {
        const penalty = Math.floor(robber.wallet * 0.45);
        robber.wallet -= penalty;
        await robber.save();

        await ctx.sock.sendMessage(ctx.from, {
          text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗘 𝗖 𝗢 𝗡 𝗢 𝗠 𝗬\n\n🚨 *ROBBERY FAILED*\n\n🚔 You got caught by enforcement!\n📉 Penalty Paid: *-🪙${penalty.toLocaleString()}*`
        }, { quoted: ctx.msg });
      }
    }
  },

  {
    name: 'heavyrob',
    aliases: ['highrob'],
    category: 'economy',
    description: 'High stakes robbery',
    execute: async (ctx) => {
      const robber = await User.getOrCreate(ctx.sender);
      const victimJid = getTargetJid(ctx);

      if (!victimJid) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Mention or reply to your target!` }, { quoted: ctx.msg });
        return;
      }

      if (victimJid === ctx.sender) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ You cannot rob yourself!` }, { quoted: ctx.msg });
        return;
      }

      if (robber.wallet < 10000) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ You need at least 🪙10,000 in your wallet to pull off a heavy heist!` }, { quoted: ctx.msg });
        return;
      }

      const victim = await User.getOrCreate(victimJid);

      if (victim.wallet < 25000) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Target wallet must contain at least 🪙25,000!` }, { quoted: ctx.msg });
        return;
      }

      const success = Math.random() < 0.24;

      if (success) {
        const percent = (Math.floor(Math.random() * 16) + 50) / 100;
        const stolen = Math.floor(victim.wallet * percent);

        victim.wallet -= stolen;
        robber.wallet += stolen;

        await victim.save();
        await robber.save();

        await ctx.sock.sendMessage(ctx.from, {
          text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗘 𝗖 𝗢 𝗡 𝗢 𝗠 𝗬\n\n💥 *HEAVY HEIST SUCCESSFUL*\n\n💎 Escaped With: *🪙${stolen.toLocaleString()}*\n👤 Target: @${victimJid.split('@')[0]}`,
          mentions: [victimJid]
        }, { quoted: ctx.msg });
      } else {
        const penaltyPercent = (Math.floor(Math.random() * 6) + 70) / 100;
        const penalty = Math.floor(robber.wallet * penaltyPercent);

        robber.wallet -= penalty;
        await robber.save();

        await ctx.sock.sendMessage(ctx.from, {
          text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗘 𝗖 𝗢 𝗡 𝗢 𝗠 𝗬\n\n💥 *HEAVY HEIST CRASHED*\n\n🚓 High Command seized your assets!\n📉 Total Loss: *-🪙${penalty.toLocaleString()}*`
        }, { quoted: ctx.msg });
      }
    }
  },

  {
    name: 'loan',
    category: 'economy',
    description: 'Emergency liquidity reserve',
    execute: async (ctx) => {
      const user = await User.getOrCreate(ctx.sender);

      if (user.custom02) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Active loan already pending! Pay back balance first.` }, { quoted: ctx.msg });
        return;
      }

      const loanAmount = 5000;
      user.wallet += loanAmount;
      user.custom02 = loanAmount;
      await user.save();

      await ctx.sock.sendMessage(ctx.from, {
        text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗘 𝗖 𝗢 𝗡 𝗢 𝗠 𝗬\n\n🏦 *EMERGENCY LOAN ISSUED*\n\n Amount: *🪙${loanAmount.toLocaleString()}*\n📌 Repayment recorded in registry.`
      }, { quoted: ctx.msg });
    }
  }
];
