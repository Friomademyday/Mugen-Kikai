import { Command } from '../types/command';
import { User } from '../database/models/User';

export const gambleCommands: Command[] = [
  {
    name: 'gamble',
    category: 'gamble',
    description: 'High-risk roll multiplier',
    execute: async (ctx) => {
      const user = await User.getOrCreate(ctx.sender);
      const amountStr = ctx.args[0]?.toLowerCase();

      if (!amountStr) {
        await ctx.sock.sendMessage(ctx.from, { text: `Specify an amount or use *all*.` }, { quoted: ctx.msg });
        return;
      }

      let bet = 0;
      if (amountStr === 'all') {
        bet = user.wallet;
      } else {
        bet = parseInt(amountStr, 10);
      }

      if (isNaN(bet) || bet <= 0) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Invalid gamble amount!` }, { quoted: ctx.msg });
        return;
      }

      if (user.wallet < bet) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Insufficient wallet funds!` }, { quoted: ctx.msg });
        return;
      }

      const win = Math.random() < 0.37;
      
      if (win) {
        user.wallet += bet;
        await user.save();
        await ctx.sock.sendMessage(ctx.from, {
          text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗚 𝗔 𝗠 𝗕 𝗟 𝗜 𝗡 𝗚\n\n🎲 *RISK ARENA: VICTORY*\n\n📈 Profit: *+🪙${bet.toLocaleString()}*\n👛 Wallet: *🪙${user.wallet.toLocaleString()}*`
        }, { quoted: ctx.msg });
      } else {
        user.wallet -= bet;
        await user.save();
        await ctx.sock.sendMessage(ctx.from, {
          text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗚 𝗔 𝗠 𝗕 𝗟 𝗜 𝗡 𝗚\n\n🎲 *RISK ARENA: DEFEAT*\n\n📉 Lost: *-🪙${bet.toLocaleString()}*\n👛 Wallet: *🪙${user.wallet.toLocaleString()}*`
        }, { quoted: ctx.msg });
      }
    }
  },

  {
    name: 'coinflip',
    aliases: ['flip'],
    category: 'gamble',
    description: 'Flip a coin against double or nothing',
    execute: async (ctx) => {
      const user = await User.getOrCreate(ctx.sender);
      const choice = ctx.args[0]?.toLowerCase();
      const betStr = ctx.args[1]?.toLowerCase();

      if (!choice || (choice !== 'heads' && choice !== 'tails')) {
        await ctx.sock.sendMessage(ctx.from, { text: `Usage: *${ctx.command} <heads|tails> <amount|all>*` }, { quoted: ctx.msg });
        return;
      }

      let bet = 0;
      if (betStr === 'all') {
        bet = user.wallet;
      } else {
        bet = parseInt(betStr, 10);
      }

      if (isNaN(bet) || bet <= 0 || user.wallet < bet) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Invalid or insufficient wallet funds!` }, { quoted: ctx.msg });
        return;
      }

      const win = Math.random() < 0.37;
      const outcome = win ? choice : (choice === 'heads' ? 'tails' : 'heads');

      if (win) {
        user.wallet += bet;
        await user.save();
        await ctx.sock.sendMessage(ctx.from, {
          text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗚 𝗔 𝗠 𝗕 𝗟 𝗜 𝗡 𝗚\n\n🪙 *COIN FLIP*\n\nResult: *${outcome.toUpperCase()}*\n✨ Prediction Matched!\n📈 Won: *+🪙${bet.toLocaleString()}*`
        }, { quoted: ctx.msg });
      } else {
        user.wallet -= bet;
        await user.save();
        await ctx.sock.sendMessage(ctx.from, {
          text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗚 𝗔 𝗠 𝗕 𝗟 𝗜 𝗡 𝗚\n\n🪙 *COIN FLIP*\n\nResult: *${outcome.toUpperCase()}*\n💥 Failed Prediction!\n📉 Lost: *-🪙${bet.toLocaleString()}*`
        }, { quoted: ctx.msg });
      }
    }
  },

  {
    name: 'slots',
    category: 'gamble',
    description: 'Slot machine reel execution',
    execute: async (ctx) => {
      const user = await User.getOrCreate(ctx.sender);
      const betStr = ctx.args[0]?.toLowerCase();

      let bet = 0;
      if (betStr === 'all') {
        bet = user.wallet;
      } else {
        bet = parseInt(betStr, 10);
      }

      if (isNaN(bet) || bet <= 0 || user.wallet < bet) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Invalid or insufficient wallet funds!` }, { quoted: ctx.msg });
        return;
      }

      const items = ['🎰', '💎', '👑', '7️⃣', '🔥', '💥'];
      const isWin = Math.random() < 0.37;
      
      let r1: string, r2: string, r3: string;
      let multiplier = 0;

      if (isWin) {
        const symbol = items[Math.floor(Math.random() * items.length)];
        r1 = symbol;
        r2 = symbol;
        r3 = Math.random() < 0.2 ? symbol : items[Math.floor(Math.random() * items.length)];
        multiplier = (r1 === r2 && r2 === r3) ? 5 : 2;
      } else {
        r1 = items[0];
        r2 = items[1];
        r3 = items[2];
        multiplier = 0;
      }

      if (multiplier > 0) {
        const reward = bet * multiplier;
        user.wallet += reward;
        await user.save();
        await ctx.sock.sendMessage(ctx.from, {
          text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗚 𝗔 𝗠 𝗕 𝗟 𝗜 𝗡 𝗚\n\n[ ${r1} | ${r2} | ${r3} ]\n\n🎉 *JACKPOT ALIGNMENT!*\nMultiplier: *${multiplier}x*\n📈 Won: *+🪙${reward.toLocaleString()}*`
        }, { quoted: ctx.msg });
      } else {
        user.wallet -= bet;
        await user.save();
        await ctx.sock.sendMessage(ctx.from, {
          text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗚 𝗔 𝗠 𝗕 𝗟 𝗜 𝗡 𝗚\n\n[ ${r1} | ${r2} | ${r3} ]\n\n💥 *NO MATCH*\n📉 Lost: *-🪙${bet.toLocaleString()}*`
        }, { quoted: ctx.msg });
      }
    }
  },

  {
    name: 'dice',
    aliases: ['roll'],
    category: 'gamble',
    description: 'High-low dice wagering',
    execute: async (ctx) => {
      const user = await User.getOrCreate(ctx.sender);
      const betStr = ctx.args[0]?.toLowerCase();

      let bet = 0;
      if (betStr === 'all') {
        bet = user.wallet;
      } else {
        bet = parseInt(betStr, 10);
      }

      if (isNaN(bet) || bet <= 0 || user.wallet < bet) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Invalid or insufficient wallet funds!` }, { quoted: ctx.msg });
        return;
      }

      const isWin = Math.random() < 0.37;
      let playerRoll: number, botRoll: number;

      if (isWin) {
        playerRoll = Math.floor(Math.random() * 3) + 4;
        botRoll = Math.floor(Math.random() * 3) + 1;
      } else {
        playerRoll = Math.floor(Math.random() * 3) + 1;
        botRoll = Math.floor(Math.random() * 3) + 4;
      }

      if (playerRoll > botRoll) {
        user.wallet += bet;
        await user.save();
        await ctx.sock.sendMessage(ctx.from, {
          text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗚 𝗔 𝗠 𝗕 𝗟 𝗜 𝗡 𝗚\n\n🎲 You: *${playerRoll}* | 🤖 House: *${botRoll}*\n\n📈 *VICTORY!*\nProfit: *+🪙${bet.toLocaleString()}*`
        }, { quoted: ctx.msg });
      } else {
        user.wallet -= bet;
        await user.save();
        await ctx.sock.sendMessage(ctx.from, {
          text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗚 𝗔 𝗠 𝗕 𝗟 𝗜 𝗡 𝗚\n\n🎲 You: *${playerRoll}* | 🤖 House: *${botRoll}*\n\n📉 *DEFEAT!*\nLost: *-🪙${bet.toLocaleString()}*`
        }, { quoted: ctx.msg });
      }
    }
  },

  {
    name: 'blackjack',
    aliases: ['bj'],
    category: 'gamble',
    description: 'Single hand instant blackjack calculation',
    execute: async (ctx) => {
      const user = await User.getOrCreate(ctx.sender);
      const betStr = ctx.args[0]?.toLowerCase();

      let bet = 0;
      if (betStr === 'all') {
        bet = user.wallet;
      } else {
        bet = parseInt(betStr, 10);
      }

      if (isNaN(bet) || bet <= 0 || user.wallet < bet) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Invalid or insufficient wallet funds!` }, { quoted: ctx.msg });
        return;
      }

      const isWin = Math.random() < 0.37;
      let pScore: number, dScore: number;

      if (isWin) {
        pScore = 20;
        dScore = 17;
      } else {
        pScore = 17;
        dScore = 20;
      }

      let msg = `♠️ *BLACKJACK TABLE*\n\nYour Hand: *${pScore}*\nDealer Hand: *${dScore}*\n\n`;

      if (pScore > dScore) {
        user.wallet += bet;
        msg += `📈 *DEALER BEATEN!* Won *+🪙${bet.toLocaleString()}*`;
      } else {
        user.wallet -= bet;
        msg += `📉 *DEALER WINS!* Lost *-🪙${bet.toLocaleString()}*`;
      }

      await user.save();
      await ctx.sock.sendMessage(ctx.from, { text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗚 𝗔 𝗠 𝗕 𝗟 𝗜 𝗡 𝗚\n\n${msg}` }, { quoted: ctx.msg });
    }
  },

  {
    name: 'roulette',
    category: 'gamble',
    description: 'Roulette wheel sector execution',
    execute: async (ctx) => {
      const user = await User.getOrCreate(ctx.sender);
      const color = ctx.args[0]?.toLowerCase();
      const betStr = ctx.args[1]?.toLowerCase();

      if (!color || (color !== 'red' && color !== 'black' && color !== 'green')) {
        await ctx.sock.sendMessage(ctx.from, { text: `Usage: *${ctx.command} <red|black|green> <amount|all>*` }, { quoted: ctx.msg });
        return;
      }

      let bet = 0;
      if (betStr === 'all') {
        bet = user.wallet;
      } else {
        bet = parseInt(betStr, 10);
      }

      if (isNaN(bet) || bet <= 0 || user.wallet < bet) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Invalid or insufficient wallet funds!` }, { quoted: ctx.msg });
        return;
      }

      const isWin = Math.random() < 0.37;
      let landedColor = color;
      let roll = 10;

      if (!isWin) {
        landedColor = color === 'red' ? 'black' : 'red';
        roll = 11;
      }

      if (isWin) {
        const mult = landedColor === 'green' ? 14 : 2;
        const reward = bet * mult;
        user.wallet += reward;
        await user.save();
        await ctx.sock.sendMessage(ctx.from, {
          text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗚 𝗔 𝗠 𝗕 𝗟 𝗜 𝗡 𝗚\n\n🎡 Wheel Landed: *${roll} (${landedColor.toUpperCase()})*\n\n🎯 *WINNER!*\nProfit: *+🪙${reward.toLocaleString()}*`
        }, { quoted: ctx.msg });
      } else {
        user.wallet -= bet;
        await user.save();
        await ctx.sock.sendMessage(ctx.from, {
          text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗚 𝗔 𝗠 𝗕 𝗟 𝗜 𝗡 𝗚\n\n🎡 Wheel Landed: *${roll} (${landedColor.toUpperCase()})*\n\n💥 *NO HIT*\nLost: *-🪙${bet.toLocaleString()}*`
        }, { quoted: ctx.msg });
      }
    }
  }
];
