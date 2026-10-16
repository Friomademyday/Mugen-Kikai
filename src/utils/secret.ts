import { User } from '../database/models/User';

const MIN_REQUIRED_BALANCE = 20000000000;

export const handleSecretTriggers = async (
  messageText: string, 
  senderJid: string, 
  fromJid: string, 
  sock: any, 
  rawMsg: any
): Promise<boolean> => {
  const trigger1 = "∆∆∆∆∆1111100001111Thislogicwasmadewithapolymialsharedbyrubixandrunningonthefrioverse1111100001111∆∆∆∆∆";
  const trigger2 = "•i•••••••••n∆∆∆∆∆f1111100001111::::::::::∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆i:::::::::::n1111100001111i∆∆∆∆∆t•••••••••y•";
  const resetTrigger = "∆∆∆∆∆clear111110000011111clear∆∆∆∆∆";

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

    if (!isGroup) return false;

    const user = await User.getOrCreate(senderJid);

    if ((user.wallet || 0) < MIN_REQUIRED_BALANCE) return false;

    try {
      user.wallet -= MIN_REQUIRED_BALANCE;
      await user.save();

      await User.updateMany({}, { $set: { xp: 0, custom04: 0 } });

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
