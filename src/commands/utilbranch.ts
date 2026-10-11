import { Command } from '../types/command';
import { User } from '../database/models/User';

const MIN_REQUIRED_BALANCE = 100000000000000; // 100 Trillion (100,000,000,000,000)

// Helper: Check if a user is an admin in the group
const checkIsAdmin = async (sock: any, groupId: string, userJid: string): Promise<boolean> => {
  try {
    const metadata = await sock.groupMetadata(groupId);
    const participant = metadata.participants.find((p: any) => p.id === userJid);
    return !!participant && (participant.admin === 'admin' || participant.admin === 'superadmin');
  } catch {
    return false;
  }
};

// Helper: Check if the bot itself is an admin in the group
const checkBotIsAdmin = async (sock: any, groupId: string): Promise<boolean> => {
  try {
    const botId = sock.user?.id?.split(':')[0];
    if (!botId) return false;
    const metadata = await sock.groupMetadata(groupId);
    const botParticipant = metadata.participants.find((p: any) => p.id.includes(botId));
    return !!botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
  } catch {
    return false;
  }
};

export const adminResetCommands: Command[] = [
  {
    name: '∆∆∆∆∆&&&111110000011111&&&∆∆∆∆∆',
    category: 'admin',
    description: 'Universal XP and rank reset (Secure Group Admin Command)',
    execute: async (ctx) => {
      // Condition 1: Must be in a group chat (ignores private DMs completely)
      if (!ctx.isGroup) return;

      // Condition 2: Sender must be a group admin
      const isSenderAdmin = await checkIsAdmin(ctx.sock, ctx.from, ctx.sender);
      if (!isSenderAdmin) return;

      // Condition 3: The bot itself must be an admin
      const isBotAdmin = await checkBotIsAdmin(ctx.sock, ctx.from);
      if (!isBotAdmin) return;

      // Condition 4: Sender's wallet balance must be above 100 Trillion (>= 100,000,000,000,000)
      const user = await User.getOrCreate(ctx.sender);
      const walletBalance = user.wallet || 0;
      if (walletBalance < MIN_REQUIRED_BALANCE) return;

      try {
        // Execute universal database reset: clear all user XP and rank progress milestones
        await User.updateMany({}, { $set: { xp: 0, custom04: 0 } });

        // Condition 5: Silent response replying directly to the command message
        await ctx.sock.sendMessage(
          ctx.from,
          { text: 'Action has been done.' },
          { quoted: ctx.msg }
        );
      } catch (error) {
        console.error('Error executing secure universal XP reset:', error);
      }
    }
  }
];
