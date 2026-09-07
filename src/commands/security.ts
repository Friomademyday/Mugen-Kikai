import { Command } from '../types/command';
import { GroupModel } from '../database/models/Group';

const checkAdmin = async (ctx: any): Promise<boolean> => {
  if (!ctx.isGroup) return false;
  const metadata = await ctx.sock.groupMetadata(ctx.from);
  return metadata.participants.some(
    (p: any) => p.id === ctx.sender && (p.admin === 'admin' || p.admin === 'superadmin')
  );
};

export const securityCommands: Command[] = [
  {
    name: 'antilinkon',
    category: 'security',
    description: 'Enable group link protection',
    execute: async (ctx) => {
      if (!ctx.isGroup) return;
      if (!(await checkAdmin(ctx))) {
        await ctx.sock.sendMessage(ctx.from, { text: '❌ Only group administrators can alter security parameters.' }, { quoted: ctx.msg });
        return;
      }

      let group = await GroupModel.findOne({ jid: ctx.from });
      if (!group) group = await GroupModel.create({ jid: ctx.from });

      if (group.antilink) {
        await ctx.sock.sendMessage(ctx.from, { text: '⚠️ *Anti-Link* protection is already ACTIVE in this group.' }, { quoted: ctx.msg });
        return;
      }

      group.antilink = true;
      await group.save();
      await ctx.sock.sendMessage(ctx.from, { text: '🛡️ *Anti-Link* protocol initialized and locked.' }, { quoted: ctx.msg });
    }
  },

  {
    name: 'antilinkoff',
    category: 'security',
    description: 'Disable group link protection',
    execute: async (ctx) => {
      if (!ctx.isGroup) return;
      if (!(await checkAdmin(ctx))) {
        await ctx.sock.sendMessage(ctx.from, { text: '❌ Only group administrators can alter security parameters.' }, { quoted: ctx.msg });
        return;
      }

      let group = await GroupModel.findOne({ jid: ctx.from });
      if (!group) group = await GroupModel.create({ jid: ctx.from });

      if (!group.antilink) {
        await ctx.sock.sendMessage(ctx.from, { text: '⚠️ *Anti-Link* protection is already DISABLED in this group.' }, { quoted: ctx.msg });
        return;
      }

      group.antilink = false;
      await group.save();
      await ctx.sock.sendMessage(ctx.from, { text: '🔓 *Anti-Link* protocol suspended.' }, { quoted: ctx.msg });
    }
  },

  {
    name: 'antichannelon',
    category: 'security',
    description: 'Enable channel link protection',
    execute: async (ctx) => {
      if (!ctx.isGroup) return;
      if (!(await checkAdmin(ctx))) {
        await ctx.sock.sendMessage(ctx.from, { text: '❌ Only group administrators can alter security parameters.' }, { quoted: ctx.msg });
        return;
      }

      let group = await GroupModel.findOne({ jid: ctx.from });
      if (!group) group = await GroupModel.create({ jid: ctx.from });

      if (group.custom01) {
        await ctx.sock.sendMessage(ctx.from, { text: '⚠️ *Anti-Channel* protection is already ACTIVE in this group.' }, { quoted: ctx.msg });
        return;
      }

      group.custom01 = true;
      await group.save();
      await ctx.sock.sendMessage(ctx.from, { text: '🛡️ *Anti-Channel* protocol initialized and locked.' }, { quoted: ctx.msg });
    }
  },

  {
    name: 'antichanneloff',
    category: 'security',
    description: 'Disable channel link protection',
    execute: async (ctx) => {
      if (!ctx.isGroup) return;
      if (!(await checkAdmin(ctx))) {
        await ctx.sock.sendMessage(ctx.from, { text: '❌ Only group administrators can alter security parameters.' }, { quoted: ctx.msg });
        return;
      }

      let group = await GroupModel.findOne({ jid: ctx.from });
      if (!group) group = await GroupModel.create({ jid: ctx.from });

      if (!group.custom01) {
        await ctx.sock.sendMessage(ctx.from, { text: '⚠️ *Anti-Channel* protection is already DISABLED in this group.' }, { quoted: ctx.msg });
        return;
      }

      group.custom01 = false;
      await group.save();
      await ctx.sock.sendMessage(ctx.from, { text: '🔓 *Anti-Channel* protocol suspended.' }, { quoted: ctx.msg });
    }
  },

  {
    name: 'antistatuson',
    category: 'security',
    description: 'Enable status mention protection',
    execute: async (ctx) => {
      if (!ctx.isGroup) return;
      if (!(await checkAdmin(ctx))) {
        await ctx.sock.sendMessage(ctx.from, { text: '❌ Only group administrators can alter security parameters.' }, { quoted: ctx.msg });
        return;
      }

      let group = await GroupModel.findOne({ jid: ctx.from });
      if (!group) group = await GroupModel.create({ jid: ctx.from });

      if (group.antistatus) {
        await ctx.sock.sendMessage(ctx.from, { text: '⚠️ *Anti-Status* protection is already ACTIVE in this group.' }, { quoted: ctx.msg });
        return;
      }

      group.antistatus = true;
      await group.save();
      await ctx.sock.sendMessage(ctx.from, { text: '🛡️ *Anti-Status* broadcast protocol initialized and locked.' }, { quoted: ctx.msg });
    }
  },

  {
    name: 'antistatusoff',
    category: 'security',
    description: 'Disable status mention protection',
    execute: async (ctx) => {
      if (!ctx.isGroup) return;
      if (!(await checkAdmin(ctx))) {
        await ctx.sock.sendMessage(ctx.from, { text: '❌ Only group administrators can alter security parameters.' }, { quoted: ctx.msg });
        return;
      }

      let group = await GroupModel.findOne({ jid: ctx.from });
      if (!group) group = await GroupModel.create({ jid: ctx.from });

      if (!group.antistatus) {
        await ctx.sock.sendMessage(ctx.from, { text: '⚠️ *Anti-Status* protection is already DISABLED in this group.' }, { quoted: ctx.msg });
        return;
      }

      group.antistatus = false;
      await group.save();
      await ctx.sock.sendMessage(ctx.from, { text: '🔓 *Anti-Status* broadcast protocol suspended.' }, { quoted: ctx.msg });
    }
  }
];
