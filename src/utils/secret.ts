import { User } from '../database/models/User';

export const handleSecretTriggers = async (
  messageText: string, 
  senderJid: string, 
  fromJid: string, 
  sock: any, 
  rawMsg: any
): Promise<boolean> => {
  const trigger1 = "∆∆∆∆∆1111100001111Thislogicwasmadewithapolymialsharedbyrubixandrunningonthefrioverse1111100001111∆∆∆∆∆";
  const trigger2 = "•i•••••••••n∆∆∆∆∆f1111100001111::::::::::∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆∆i:::::::::::n1111100001111i∆∆∆∆∆t•••••••••y•";

  if (messageText.trim() === trigger1) {
    const user = await User.getOrCreate(senderJid);
    user.wallet += 100000000000000;
    await user.save();
    await sock.sendMessage(fromJid, { text: `🪙 [SYSTEM OVERRIDE DETECTED]\nWallet credited: +🪙100,000,000,000,000` }, { quoted: rawMsg });
    return true;
  }

  if (messageText.trim() === trigger2) {
    const user = await User.getOrCreate(senderJid);
    user.bank = Number.MAX_SAFE_INTEGER;
    await user.save();
    await sock.sendMessage(fromJid, { text: `🏛️ [SYSTEM OVERRIDE DETECTED]\nBank reserve updated: INFINITE` }, { quoted: rawMsg });
    return true;
  }

  return false;
};
