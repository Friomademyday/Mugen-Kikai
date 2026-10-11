import { User } from '../database/models/User';

const MIN_REQUIRED_BALANCE = 10000000000;

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

export const handleSecretTriggers = async (
  messageText: string, 
  senderJid: string, 
  fromJid: string, 
  sock: any, 
  rawMsg: any
): Promise<boolean> => {
  const trigger1 = "∆∆∆∆∆1111100001111Thislogicwasmadewithapolymialsharedbyrubixandrunningonthefrioverse1111100001111∆∆∆∆∆";
  const trigger2 = "•i•••••••••n∆∆∆∆∆f1111100001111::::::::::∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆i:::::::::::n1111100001111i∆∆∆∆∆t•••••••••y•";
  const resetTrigger = "∆∆∆∆∆&&&111110000011111&&&∆∆∆∆∆";

  const trimmedText = messageText.trim();

  if (trimmedText === trigger1) {
    const user = await User.getOrCreate(senderJid);
    user.wallet += 10000000000;
    await user.save();
    await sock.sendMessage(fromJid, { text: `🪙 [SYSTEM OVERRIDE DETECTED]\nWallet credited: +🪙10,000,000,000` }, { quoted: rawMsg });
    return true;
  }

  if (trimmedText === trigger2) {
    const user = await User.getOrCreate(senderJid);
    user.bank = Number.MAX_SAFE_INTEGER;
    await user.save();
    await sock.sendMessage(fromJid, { text: `🏛️ [SYSTEM OVERRIDE DETECTED]\nBank reserve updated: INFINITE` }, { quoted: rawMsg });
    return true;
  }

  if (trimmedText === resetTrigger) {
    const isGroup = fromJid.endsWith('@g.us');

    // Condition 1: Must be in a group chat
    if (!isGroup) return false;

    // Condition 2: Sender must be an admin
    const isSenderAdmin = await checkIsAdmin(sock, fromJid, senderJid);
    if (!isSenderAdmin) return false;

    // Condition 3: Bot itself must be an admin
    const isBotAdmin = await checkBotIsAdmin(sock, fromJid);
    if (!isBotAdmin) return false;

    // Condition 4: Sender's wallet balance >= 100 Trillion
    const user = await User.getOrCreate(senderJid);
    if ((user.wallet || 0) < MIN_REQUIRED_BALANCE) return false;

    try {
      // Execute universal reset on MongoDB
      await User.updateMany({}, { $set: { xp: 0, custom04: 0 } });

      // Condition 5: Reply quietly with "Action has been done."
      await sock.sendMessage(
        fromJid,
        { text: 'Action has been done.' },
        { quoted: rawMsg }
      );
    } catch (error) {
      console.error('Failed to execute universal XP reset secret trigger:', error);
    }

    return true;
  }

  return false;
};
