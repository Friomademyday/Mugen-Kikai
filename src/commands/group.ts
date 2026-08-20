import { Command } from '../types/command';
import { GroupModel } from '../database/models/Group';
import { WarnModel } from '../database/models/Warn';

async function checkIsAdmin(sock: any, from: string, sender: string): Promise<boolean> {
  const metadata = await sock.groupMetadata(from);
  const participant = metadata.participants.find((p: any) => p.id === sender);
  return participant?.admin === 'admin' || participant?.admin === 'superadmin';
}

export const groupCommands: Command[] = [
  {
    name: 'antilink',
    category: 'group',
    description: 'Toggle antilink protection on or off',
    execute: async ({ sock, from, msg, sender, args, isGroup }) => {
      if (!isGroup) return;
      if (!(await checkIsAdmin(sock, from, sender))) {
        await sock.sendMessage(from, { text: 'Only group admins can use this command.' }, { quoted: msg });
        return;
      }

      const status = args[0]?.toLowerCase();
      if (status !== 'on' && status !== 'off') {
        await sock.sendMessage(from, { text: 'Usage: .antilink on | off' }, { quoted: msg });
        return;
      }

      const isEnabled = status === 'on';
      await GroupModel.findOneAndUpdate(
        { jid: from },
        { antilink: isEnabled },
        { upsert: true, new: true }
      );

      await sock.sendMessage(from, { text: `Antilink is now ${isEnabled ? 'ENABLED' : 'DISABLED'}.` }, { quoted: msg });
    }
  },
  {
    name: 'antistatus',
    category: 'group',
    description: 'Toggle anti-status mention protection on or off',
    execute: async ({ sock, from, msg, sender, args, isGroup }) => {
      if (!isGroup) return;
      if (!(await checkIsAdmin(sock, from, sender))) {
        await sock.sendMessage(from, { text: 'Only group admins can use this command.' }, { quoted: msg });
        return;
      }

      const status = args[0]?.toLowerCase();
      if (status !== 'on' && status !== 'off') {
        await sock.sendMessage(from, { text: 'Usage: .antistatus on | off' }, { quoted: msg });
        return;
      }

      const isEnabled = status === 'on';
      await GroupModel.findOneAndUpdate(
        { jid: from },
        { antistatus: isEnabled },
        { upsert: true, new: true }
      );

      await sock.sendMessage(from, { text: `Anti-status protection is now ${isEnabled ? 'ENABLED' : 'DISABLED'}.` }, { quoted: msg });
    }
  },
  {
    name: 'kick',
    category: 'group',
    description: 'Kick a member from the group',
    execute: async ({ sock, from, msg, sender, isGroup }) => {
      if (!isGroup) return;
      if (!(await checkIsAdmin(sock, from, sender))) {
        await sock.sendMessage(from, { text: 'Only admins can use this.' }, { quoted: msg });
        return;
      }

      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) {
        await sock.sendMessage(from, { text: 'Please tag a user to kick.' }, { quoted: msg });
        return;
      }

      await sock.groupParticipantsUpdate(from, [target], 'remove');
      await sock.sendMessage(from, { text: 'User removed.' }, { quoted: msg });
    }
  },
  {
    name: 'promote',
    category: 'group',
    description: 'Promote a member to group admin',
    execute: async ({ sock, from, msg, sender, isGroup }) => {
      if (!isGroup) return;
      if (!(await checkIsAdmin(sock, from, sender))) {
        await sock.sendMessage(from, { text: 'Only admins can use this.' }, { quoted: msg });
        return;
      }

      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) {
        await sock.sendMessage(from, { text: 'Please tag a user to promote.' }, { quoted: msg });
        return;
      }

      await sock.groupParticipantsUpdate(from, [target], 'promote');
      await sock.sendMessage(from, { text: 'User promoted to admin.' }, { quoted: msg });
    }
  },
  {
    name: 'demote',
    category: 'group',
    description: 'Demote an admin to a normal member',
    execute: async ({ sock, from, msg, sender, isGroup }) => {
      if (!isGroup) return;
      if (!(await checkIsAdmin(sock, from, sender))) {
        await sock.sendMessage(from, { text: 'Only admins can use this.' }, { quoted: msg });
        return;
      }

      const target = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
      if (!target) {
        await sock.sendMessage(from, { text: 'Please tag an admin to demote.' }, { quoted: msg });
        return;
      }

      await sock.groupParticipantsUpdate(from, [target], 'demote');
      await sock.sendMessage(from, { text: 'Admin demoted to regular member.' }, { quoted: msg });
    }
  },
  {
    name: 'mute',
    category: 'group',
    description: 'Close group so only admins can send messages',
    execute: async ({ sock, from, msg, sender, isGroup }) => {
      if (!isGroup) return;
      if (!(await checkIsAdmin(sock, from, sender))) {
        await sock.sendMessage(from, { text: 'Only admins can use this.' }, { quoted: msg });
        return;
      }

      await sock.groupSettingUpdate(from, 'announcement');
      await sock.sendMessage(from, { text: 'Group has been muted. Only admins can send messages.' }, { quoted: msg });
    }
  },
  {
    name: 'unmute',
    category: 'group',
    description: 'Open group so all participants can message',
    execute: async ({ sock, from, msg, sender, isGroup }) => {
      if (!isGroup) return;
      if (!(await checkIsAdmin(sock, from, sender))) {
        await sock.sendMessage(from, { text: 'Only admins can use this.' }, { quoted: msg });
        return;
      }

      await sock.groupSettingUpdate(from, 'not_announcement');
      await sock.sendMessage(from, { text: 'Group has been unmuted. All members can speak.' }, { quoted: msg });
    }
  },
  {
    name: 'tagall',
    category: 'group',
    description: 'Tag all members in the group',
    execute: async ({ sock, from, msg, sender, isGroup, text }) => {
      if (!isGroup) return;
      if (!(await checkIsAdmin(sock, from, sender))) {
        await sock.sendMessage(from, { text: 'Only admins can use this.' }, { quoted: msg });
        return;
      }

      const metadata = await sock.groupMetadata(from);
      const participants = metadata.participants.map((p: any) => p.id);
      
      let message = `*Tagging All Members*\n*Message:* ${text || 'None'}\n\n`;
      for (const participant of participants) {
        message += `@${participant.split('@')[0]}\n`;
      }

      await sock.sendMessage(from, { text: message, mentions: participants }, { quoted: msg });
    }
  },
  {
    name: 'hidetag',
    category: 'group',
    description: 'Broadcast a message silently tagging everyone',
    execute: async ({ sock, from, msg, sender, isGroup, text }) => {
      if (!isGroup) return;
      if (!(await checkIsAdmin(sock, from, sender))) {
        await sock.sendMessage(from, { text: 'Only admins can use this.' }, { quoted: msg });
        return;
      }

      const metadata = await sock.groupMetadata(from);
      const participants = metadata.participants.map((p: any) => p.id);

      await sock.sendMessage(from, { text: text || 'Attention everyone!', mentions: participants }, { quoted: msg });
    }
  }
];
