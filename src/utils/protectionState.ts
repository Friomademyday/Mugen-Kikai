import { WASocket } from '@whiskeysockets/baileys';

// In-memory state tracking: Group JID -> State (1 = Active, 0 = Inactive)
export const antilinkState = new Map<string, number>();
export const antichannelState = new Map<string, number>();
export const antistatusState = new Map<string, number>();
export const antialllinkState = new Map<string, number>();

export async function checkIsAdmin(sock: WASocket, from: string, sender: string): Promise<boolean> {
  const metadata = await sock.groupMetadata(from);
  const extractId = (jid?: string) => jid ? jid.split('@')[0].split(':')[0] : '';
  const senderId = extractId(sender);

  return metadata.participants.some(p => 
    extractId(p.id) === senderId && (p.admin === 'admin' || p.admin === 'superadmin')
  );
}
