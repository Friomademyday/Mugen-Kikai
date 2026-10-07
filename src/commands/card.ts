import { CommandContext } from '../index';
import { User } from '../database/models/User';
import { cardLoader, RARITY_BASE_COSTS } from '../services/cardLoader';
import fs from 'fs';

export const cardCommands = [
  {
    name: 'buy',
    description: 'Purchases a card from the shop',
    execute: async (ctx: CommandContext) => {
      const input = ctx.args.join('').replace(/^card-/i, '').replace(/^card/i, '').trim().toLowerCase();
      if (!input) {
        await ctx.sock.sendMessage(ctx.from, { text: '⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\n Specify a card ID to buy! Example: buy-luffy' }, { quoted: ctx.msg });
        return;
      }

      const card = cardLoader.getCard(input);
      if (!card) {
        await ctx.sock.sendMessage(ctx.from, { text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nCard "${input}" does not exist!` }, { quoted: ctx.msg });
        return;
      }

      const user = await User.getOrCreate(ctx.sender);
      const existing = user.inventory.find((i) => i.character_id.toLowerCase() === card.character_id.toLowerCase());
      if (existing) {
        await ctx.sock.sendMessage(ctx.from, { text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nYou already own ${card.name}!` }, { quoted: ctx.msg });
        return;
      }

      const cost = RARITY_BASE_COSTS[card.rarity];
      if (user.wallet < cost) {
        await ctx.sock.sendMessage(
          ctx.from,
          { text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nInsufficient funds! ${card.name} costs 🪙${cost.toLocaleString()}, but your wallet has 🪙${user.wallet.toLocaleString()}` },
          { quoted: ctx.msg }
        );
        return;
      }

      user.wallet -= cost;
      user.inventory.push({ character_id: card.character_id.toLowerCase(), level: 1 });
      await user.save();

      const imagePath = cardLoader.getCardImagePath(card.character_id, 1);
      const captionText =
`⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩

> SUCCESSFULLY PURCHASED CARD!
CARD: ${card.name}
TYPE: ${card.character_type.toUpperCase()}
RARITY: ${card.rarity}
LEVEL: 1
COST: 🪙${cost.toLocaleString()}

REMAINING WALLET: 🪙${user.wallet.toLocaleString()}`;

      if (fs.existsSync(imagePath)) {
        await ctx.sock.sendMessage(ctx.from, { image: fs.readFileSync(imagePath), caption: captionText }, { quoted: ctx.msg });
      } else {
        await ctx.sock.sendMessage(ctx.from, { text: captionText }, { quoted: ctx.msg });
      }
    }
  },

  {
    name: 'mycards',
    description: 'Displays your owned card collection',
    execute: async (ctx: CommandContext) => {
      const user = await User.getOrCreate(ctx.sender);
      if (!user.inventory || user.inventory.length === 0) {
        await ctx.sock.sendMessage(ctx.from, { text: '⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nYou do not own any cards yet! Use buy-<card_id> to start.' }, { quoted: ctx.msg });
        return;
      }

      let caption = `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\n`;
      caption += `@${ctx.sender.split('@')[0]}'s COLLECTION (${user.inventory.length} Cards)\n\n`;

      for (let i = 0; i < user.inventory.length; i++) {
        const item = user.inventory[i];
        const card = cardLoader.getCard(item.character_id);
        const cardName = card ? card.name : item.character_id;
        const cardType = card ? card.character_type.toUpperCase() : 'UNKNOWN';

        caption += `${i + 1}. *${cardName}* [${cardType}]\n`;
        caption += `   ├─ Level: ${item.level}/5\n`;
        caption += `   └─ ID: \`${item.character_id}\`\n\n`;
      }

      await ctx.sock.sendMessage(ctx.from, { text: caption, mentions: [ctx.sender] }, { quoted: ctx.msg });
    }
  },

  {
    name: 'card',
    description: 'Inspects detailed card statistics',
    execute: async (ctx: CommandContext) => {
      const input = ctx.args.join('').replace(/^card-/i, '').replace(/^card/i, '').trim().toLowerCase();
      if (!input) {
        await ctx.sock.sendMessage(ctx.from, { text: '⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nSpecify a card ID! Example: card-luffy' }, { quoted: ctx.msg });
        return;
      }

      const card = cardLoader.getCard(input);
      if (!card) {
        await ctx.sock.sendMessage(ctx.from, { text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nCard "${input}" not found!` }, { quoted: ctx.msg });
        return;
      }

      const user = await User.getOrCreate(ctx.sender);
      const invItem = user.inventory.find((i) => i.character_id.toLowerCase() === card.character_id.toLowerCase());
      const userLevel = invItem ? invItem.level : 1;

      let text = `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\n`;
      text += `CARD: ${card.name}\n`;
      text += `TYPE: ${card.character_type.toUpperCase()}\n`;
      text += `RARITY: ${card.rarity}\n`;
      text += `OWNED LEVEL: ${userLevel}/${card.max_level}\n\n`;
      text += `MOVES & SCALED POINTS:\n`;

      for (const move of card.moves) {
        const scaled = cardLoader.calculateScaledPoints(move.base_points, userLevel);
        const bxp = move.bxp_cost || 3;
        text += `• *${move.name}* (\`${move.move_id}\`)\n  ├─ Base: ${move.base_points} ➔ Scaled: ${scaled}\n  └─ BXP Cost: ⚡ ${bxp}\n`;
      }

      const imagePath = cardLoader.getCardImagePath(card.character_id, userLevel);
      if (fs.existsSync(imagePath)) {
        await ctx.sock.sendMessage(ctx.from, { image: fs.readFileSync(imagePath), caption: text }, { quoted: ctx.msg });
      } else {
        await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
      }
    }
  },

  {
    name: 'upgrade',
    description: 'Upgrades an owned card level',
    execute: async (ctx: CommandContext) => {
      const input = ctx.args.join('').replace(/^upg-/i, '').replace(/^upg/i, '').trim().toLowerCase();
      if (!input) {
        await ctx.sock.sendMessage(ctx.from, { text: '⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nSpecify a card ID to upgrade! Example: upg-luffy' }, { quoted: ctx.msg });
        return;
      }

      const card = cardLoader.getCard(input);
      if (!card) {
        await ctx.sock.sendMessage(ctx.from, { text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nCard "${input}" does not exist!` }, { quoted: ctx.msg });
        return;
      }

      const user = await User.getOrCreate(ctx.sender);
      const invItem = user.inventory.find((i) => i.character_id.toLowerCase() === card.character_id.toLowerCase());
      if (!invItem) {
        await ctx.sock.sendMessage(ctx.from, { text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nYou do not own ${card.name}!` }, { quoted: ctx.msg });
        return;
      }

      if (invItem.level >= card.max_level) {
        await ctx.sock.sendMessage(ctx.from, { text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\n*${card.name}* is already at MAX level (${card.max_level})!` }, { quoted: ctx.msg });
        return;
      }

      const targetLevel = invItem.level + 1;
      const cost = cardLoader.calculateUpgradeCost(card.rarity, targetLevel);

      if (user.wallet < cost) {
        await ctx.sock.sendMessage(
          ctx.from,
          { text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nInsufficient funds! Upgrading to Level ${targetLevel} costs 🪙${cost.toLocaleString()}, but your wallet has 🪙${user.wallet.toLocaleString()}` },
          { quoted: ctx.msg }
        );
        return;
      }

      user.wallet -= cost;
      invItem.level = targetLevel;
      await user.save();

      const imagePath = cardLoader.getCardImagePath(card.character_id, targetLevel);
      const captionText =
`⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩

> SUCCESSFULLY UPGRADED CARD!
CARD: ${card.name}
NEW LEVEL: ${targetLevel}/${card.max_level}
UPGRADE COST: 🪙${cost.toLocaleString()}
REMAINING WALLET: 🪙${user.wallet.toLocaleString()}`;

      if (fs.existsSync(imagePath)) {
        await ctx.sock.sendMessage(ctx.from, { image: fs.readFileSync(imagePath), caption: captionText }, { quoted: ctx.msg });
      } else {
        await ctx.sock.sendMessage(ctx.from, { text: captionText }, { quoted: ctx.msg });
      }
    }
  }
];
