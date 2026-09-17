import { Command } from '../types/command';
import { GroupModel } from '../database/models/Group';
import { WarnModel } from '../database/models/Warn';
import { 
  antilinkState, 
  antichannelState, 
  antistatusState, 
  antialllinkState,
  checkIsAdmin 
} from '../utils/protectionState';

export const groupCommands: Command[] = [
  /*
  {
    name: 'antilink',
    aliases: ['antilinkon', 'antilinkoff'],
    category: 'group',
    description: 'Toggle WhatsApp group link protection',
    execute: async ({ sock, from, msg, sender, args, command, isGroup }) => {
      if (!isGroup) return;
      if (!(await checkIsAdmin(sock, from, sender))) {
        await sock.sendMessage(from, { text: 'Only group admins can use this command.' }, { quoted: msg });
        return;
      }

      let targetState = -1;
      if (command === 'antilinkon') targetState = 1;
      if (command === 'antilinkoff') targetState = 0;

      if (targetState === -1) {
        const input = args[0]?.toLowerCase();
        if (input === 'on' || input === '1') targetState = 1;
        else if (input === 'off' || input === '0') targetState = 0;
      }

      if (targetState !== 1 && targetState !== 0) {
        await sock.sendMessage(from, { text: 'Usage: .antilink on | off' }, { quoted: msg });
        return;
      }

      const currentState = antilinkState.get(from) || 0;

      if (targetState === 1) {
        if (currentState === 1) {
          await sock.sendMessage(from, { text: '⚠️ Antilink protection is ALREADY active in this group.' }, { quoted: msg });
          return;
        }
        antilinkState.set(from, 1);
        await sock.sendMessage(from, { text: '✅ Antilink protection has been ACTIVATED [1].' }, { quoted: msg });
      } else {
        if (currentState === 0) {
          await sock.sendMessage(from, { text: '⚠️ Antilink protection is ALREADY disabled in this group.' }, { quoted: msg });
          return;
        }
        antilinkState.set(from, 0);
        await sock.sendMessage(from, { text: '❌ Antilink protection has been DEACTIVATED [0].' }, { quoted: msg });
      }
    }
  },

  {
    name: 'antichannel',
    aliases: ['antichannelon', 'antichanneloff'],
    category: 'group',
    description: 'Toggle WhatsApp channel link protection',
    execute: async ({ sock, from, msg, sender, args, command, isGroup }) => {
      if (!isGroup) return;
      if (!(await checkIsAdmin(sock, from, sender))) {
        await sock.sendMessage(from, { text: 'Only group admins can use this command.' }, { quoted: msg });
        return;
      }

      let targetState = -1;
      if (command === 'antichannelon') targetState = 1;
      if (command === 'antichanneloff') targetState = 0;

      if (targetState === -1) {
        const input = args[0]?.toLowerCase();
        if (input === 'on' || input === '1') targetState = 1;
        else if (input === 'off' || input === '0') targetState = 0;
      }

      if (targetState !== 1 && targetState !== 0) {
        await sock.sendMessage(from, { text: 'Usage: .antichannel on | off' }, { quoted: msg });
        return;
      }

      const currentState = antichannelState.get(from) || 0;

      if (targetState === 1) {
        if (currentState === 1) {
          await sock.sendMessage(from, { text: '⚠️ Anti-channel protection is ALREADY active in this group.' }, { quoted: msg });
          return;
        }
        antichannelState.set(from, 1);
        await sock.sendMessage(from, { text: '✅ Anti-channel protection has been ACTIVATED [1].' }, { quoted: msg });
      } else {
        if (currentState === 0) {
          await sock.sendMessage(from, { text: '⚠️ Anti-channel protection is ALREADY disabled in this group.' }, { quoted: msg });
          return;
        }
        antichannelState.set(from, 0);
        await sock.sendMessage(from, { text: '❌ Anti-channel protection has been DEACTIVATED [0].' }, { quoted: msg });
      }
    }
  },

  {
    name: 'antistatus',
    aliases: ['antistatuson', 'antistatusoff'],
    category: 'group',
    description: 'Toggle anti-status mention protection',
    execute: async ({ sock, from, msg, sender, args, command, isGroup }) => {
      if (!isGroup) return;
      if (!(await checkIsAdmin(sock, from, sender))) {
        await sock.sendMessage(from, { text: 'Only group admins can use this command.' }, { quoted: msg });
        return;
      }

      let targetState = -1;
      if (command === 'antistatuson') targetState = 1;
      if (command === 'antistatusoff') targetState = 0;

      if (targetState === -1) {
        const input = args[0]?.toLowerCase();
        if (input === 'on' || input === '1') targetState = 1;
        else if (input === 'off' || input === '0') targetState = 0;
      }

      if (targetState !== 1 && targetState !== 0) {
        await sock.sendMessage(from, { text: 'Usage: .antistatus on | off' }, { quoted: msg });
        return;
      }

      const currentState = antistatusState.get(from) || 0;

      if (targetState === 1) {
        if (currentState === 1) {
          await sock.sendMessage(from, { text: '⚠️ Anti-status protection is ALREADY active in this group.' }, { quoted: msg });
          return;
        }
        antistatusState.set(from, 1);
        await sock.sendMessage(from, { text: '✅ Anti-status protection has been ACTIVATED [1].' }, { quoted: msg });
      } else {
        if (currentState === 0) {
          await sock.sendMessage(from, { text: '⚠️ Anti-status protection is ALREADY disabled in this group.' }, { quoted: msg });
          return;
        }
        antistatusState.set(from, 0);
        await sock.sendMessage(from, { text: '❌ Anti-status protection has been DEACTIVATED [0].' }, { quoted: msg });
      }
    }
  },

  {
    name: 'antialllink',
    aliases: ['antialllinkon', 'antialllinkoff', 'antiall', 'antialllinks'],
    category: 'group',
    description: 'Toggle protection against ALL URL links',
    execute: async ({ sock, from, msg, sender, args, command, isGroup }) => {
      if (!isGroup) return;
      if (!(await checkIsAdmin(sock, from, sender))) {
        await sock.sendMessage(from, { text: 'Only group admins can use this command.' }, { quoted: msg });
        return;
      }

      let targetState = -1;
      if (command === 'antialllinkon') targetState = 1;
      if (command === 'antialllinkoff') targetState = 0;

      if (targetState === -1) {
        const input = args[0]?.toLowerCase();
        if (input === 'on' || input === '1') targetState = 1;
        else if (input === 'off' || input === '0') targetState = 0;
      }

      if (targetState !== 1 && targetState !== 0) {
        await sock.sendMessage(from, { text: 'Usage: .antialllink on | off' }, { quoted: msg });
        return;
      }

      const currentState = antialllinkState.get(from) || 0;

      if (targetState === 1) {
        if (currentState === 1) {
          await sock.sendMessage(from, { text: '⚠️ Universal link protection is ALREADY active in this group.' }, { quoted: msg });
          return;
        }
        antialllinkState.set(from, 1);
        await sock.sendMessage(from, { text: '✅ Universal link protection has been ACTIVATED [1].' }, { quoted: msg });
      } else {
        if (currentState === 0) {
          await sock.sendMessage(from, { text: '⚠️ Universal link protection is ALREADY disabled in this group.' }, { quoted: msg });
          return;
        }
        antialllinkState.set(from, 0);
        await sock.sendMessage(from, { text: '❌ Universal link protection has been DEACTIVATED [0].' }, { quoted: msg });
      }
    }
  },    */
  
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
