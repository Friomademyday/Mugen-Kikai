import { CommandContext } from '../index';
import { duelManager } from '../services/duelManager';

export const duelCommands = [
  {
    name: 'duel',
    description: 'Challenges a tagged user to a card duel',
    execute: async (ctx: CommandContext) => {
      const mentionedJids = ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (mentionedJids.length === 0) {
        await ctx.sock.sendMessage(ctx.from, { text: '⬩Ｍ Ｕ Ｇ Ｅ Ｎ⬩ Tag a user to duel! Example: duel @user' }, { quoted: ctx.msg });
        return;
      }

      const targetJid = mentionedJids[0];
      if (targetJid === ctx.sender) {
        await ctx.sock.sendMessage(ctx.from, { text: '⬩Ｍ Ｕ Ｇ Ｅ Ｎ⬩ You cannot challenge yourself!' }, { quoted: ctx.msg });
        return;
      }

      await duelManager.initiateChallenge(ctx.from, ctx.sender, targetJid, ctx.sock);
    }
  },

  {
    name: 'accept',
    description: 'Accepts an active duel challenge',
    execute: async (ctx: CommandContext) => {
      await duelManager.acceptChallenge(ctx.from, ctx.sender, ctx.sock);
    }
  },

  {
    name: 'off1',
    description: 'Selects Offense card slot 1',
    execute: async (ctx: CommandContext) => {
      const cardId = ctx.text.replace(/^off1-/i, '').replace(/^off1/i, '').trim().toLowerCase();
      if (!cardId) return;
      await duelManager.selectOffenseCard(ctx.from, ctx.sender, 1, cardId, ctx.sock);
    }
  },

  {
    name: 'off2',
    description: 'Selects Offense card slot 2',
    execute: async (ctx: CommandContext) => {
      const cardId = ctx.text.replace(/^off2-/i, '').replace(/^off2/i, '').trim().toLowerCase();
      if (!cardId) return;
      await duelManager.selectOffenseCard(ctx.from, ctx.sender, 2, cardId, ctx.sock);
    }
  },

  {
    name: 'def1',
    description: 'Equips defense move to Left Wing',
    execute: async (ctx: CommandContext) => {
      const moveId = ctx.text.replace(/^def1-/i, '').replace(/^def1/i, '').trim().toLowerCase();
      if (!moveId) return;
      await duelManager.selectDefenseMove(ctx.from, ctx.sender, 1, moveId, ctx.sock);
    }
  },

  {
    name: 'def2',
    description: 'Equips defense move to Right Wing',
    execute: async (ctx: CommandContext) => {
      const moveId = ctx.text.replace(/^def2-/i, '').replace(/^def2/i, '').trim().toLowerCase();
      if (!moveId) return;
      await duelManager.selectDefenseMove(ctx.from, ctx.sender, 2, moveId, ctx.sock);
    }
  }
];
