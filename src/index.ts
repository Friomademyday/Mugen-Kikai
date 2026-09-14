import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  WASocket,
  WAMessage
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { CONFIG } from './config';
import { commands } from './commands';
import { connectDB } from './database/connect';
import { GroupModel } from './database/models/Group';
import { User } from './database/models/User';
import { handleSecretTriggers } from './utils/secret';
import fs from 'fs';
import path from 'path';
import { 
  antilinkState, 
  antichannelState, 
  antistatusState, 
  antialllinkState 
} from './utils/protectionState';

export interface CommandContext {
  sock: WASocket;
  msg: WAMessage;
  from: string;
  sender: string;
  args: string[];
  command: string;
  text: string;
  isGroup: boolean;
}

export interface Command {
  name: string;
  description: string;
  aliases?: string[];
  execute: (ctx: CommandContext) => Promise<void>;
}

let pairingRequested = false;
let pairingTimer: NodeJS.Timeout | null = null;

async function startBot() {
  await connectDB();

  const authFolder = path.join(__dirname, '..', 'baileys_auth_info');
  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 10000
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'connecting') {
      if (!sock.authState.creds.registered && !pairingRequested) {
        pairingRequested = true;
        
        const rawNumber = process.env.OWNER_NUMBER || CONFIG.ownerNumber || '';
        const phoneNumber = rawNumber.replace(/[^0-9]/g, '');

        if (!phoneNumber) {
          console.error('ERROR: OWNER_NUMBER environment variable is missing or empty!');
          pairingRequested = false;
          return;
        }

        if (pairingTimer) clearTimeout(pairingTimer);

        pairingTimer = setTimeout(async () => {
          try {
            const code = await sock.requestPairingCode(phoneNumber);
            console.log(`\n========================================`);
            console.log(`YOUR WHATSAPP PAIRING CODE: ${code}`);
            console.log(`========================================\n`);
          } catch (err) {
            console.error('Failed to request pairing code:', err);
            pairingRequested = false;
          }
        }, 6000);
      }
    }

    if (connection === 'close') {
      if (pairingTimer) {
        clearTimeout(pairingTimer);
        pairingTimer = null;
      }
      pairingRequested = false;

      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      console.log(`Connection closed (status: ${statusCode}), reconnecting: ${shouldReconnect}`);
      
      if (shouldReconnect) {
        setTimeout(() => startBot(), 3000);
      } else {
        console.log('Logged out or session invalid. Deleting auth folder for fresh pair...');
        if (fs.existsSync(authFolder)) {
          fs.rmSync(authFolder, { recursive: true, force: true });
        }
        setTimeout(() => startBot(), 3000);
      }
    } else if (connection === 'open') {
      console.log('Mugen Kikai MD connected successfully!');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid || '';
    const sender = msg.key.participant || msg.key.remoteJid || '';
    const isGroup = from.endsWith('@g.us');
    const pushName = msg.pushName || undefined;

    if (sender) {
      await User.getOrCreate(sender, pushName);
    }

    const messageContent = 
  msg.message.conversation || 
  msg.message.extendedTextMessage?.text || 
  msg.message.imageMessage?.caption || 
  msg.message.videoMessage?.caption || 
  msg.message.documentMessage?.caption || 
  '';

    const secretTriggered = await handleSecretTriggers(messageContent, sender, from, sock, msg);
    if (secretTriggered) return;

    if (isGroup) {
      // 1. Separate regular links from channel links cleanly
      const isChannelLink = /whatsapp\.com\/channel\/[^\s]+/gi.test(messageContent);
      const isStandardLink = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[^\s]+|wa\.me\/[^\s]+)/gi.test(messageContent) && !isChannelLink;
      
      // 2. Comprehensive check for status mentions
      const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.imageMessage?.contextInfo || msg.message?.videoMessage?.contextInfo;
      const isStatusMention = 
        Boolean(msg.message?.groupMentionedMessage) ||
        contextInfo?.remoteJid === 'status@broadcast' ||
        (Array.isArray(contextInfo?.mentionedJid) && contextInfo.mentionedJid.includes('status@broadcast')) ||
        messageContent.includes('status@broadcast');

      if (isStandardLink || isChannelLink || isStatusMention) {
        const metadata = await sock.groupMetadata(from);
        
        // Helper to normalize JIDs (strip device identifiers like :1 or :2)
        const normalizeJid = (jid?: string) => jid ? jid.split('@')[0].split(':')[0] + '@s.whatsapp.net' : '';

        const rawBotJid = sock.user?.id;
        const normalizedBotJid = normalizeJid(rawBotJid);
        const normalizedSender = normalizeJid(sender);

        const botIsAdmin = metadata.participants.some(p => 
          normalizeJid(p.id) === normalizedBotJid && (p.admin === 'admin' || p.admin === 'superadmin')
        );

        if (botIsAdmin) {
          const senderIsAdmin = metadata.participants.some(p => 
            normalizeJid(p.id) === normalizedSender && (p.admin === 'admin' || p.admin === 'superadmin')
          );

          if (!senderIsAdmin) {
            let isOwnGroupLink = false;
            if (isStandardLink) {
              const inviteCodeMatch = messageContent.match(/chat\.whatsapp\.com\/([a-zA-Z0-9–_]+)/);
              if (inviteCodeMatch && inviteCodeMatch[1]) {
                try {
                  const currentInvite = await sock.groupInviteCode(from);
                  if (currentInvite === inviteCodeMatch[1]) {
                    isOwnGroupLink = true;
                  }
                } catch (_) {}
              }
            }

            if (!isOwnGroupLink) {
              const groupSettings = await GroupModel.findOne({ jid: from });
              if (groupSettings) {
                let violationType = '';

                if (groupSettings.antilink && isStandardLink) violationType = 'Unauthorized External Group/Site Link';
                if (groupSettings.custom01 && isChannelLink) violationType = 'Unauthorized WhatsApp Channel Link Promotion';
                if (groupSettings.antistatus && isStatusMention) violationType = 'Unauthorized Status Broadcast Mention';

                if (violationType) {
                  // Delete violating message
                  await sock.sendMessage(from, { delete: msg.key }).catch(() => {});
                  
                  // Send notice
                  await sock.sendMessage(from, {
                    text: `▬▬▬▬▬ ⬩ 𝗙 𝗥 𝗜 𝗢 𝗩 𝗘 𝗥 𝗦 𝗘\n\n🚨 *SECURITY ENFORCEMENT*\n\nUser: @${normalizedSender.split('@')[0]}\nViolation: *${violationType}*\n\n⚡ Action Executed: *Instant Eviction*\n\nNotice: This action was triggered automatically by the Frioverse Security Core. The bot does not retain manual re-entry privileges. If you believe this was an error, contact a human group administrator directly—do NOT message this automated terminal.`,
                    mentions: [sender]
                  });

                  // Remove member
                  await sock.groupParticipantsUpdate(from, [sender], 'remove').catch(() => {});
                  return;
                }
              }
            }
          }
        }
      }
    }

    
    if (!messageContent.startsWith(CONFIG.prefix)) return;

    const args = messageContent.slice(CONFIG.prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    const targetCommand = commands.get(commandName);

    if (targetCommand) {
      try {
        await targetCommand.execute({
          sock,
          msg,
          from,
          sender,
          args,
          command: commandName,
          text: args.join(' '),
          isGroup
        });
      } catch (error) {
        console.error(`Error executing ${commandName}:`, error);
        await sock.sendMessage(from, { text: 'An error occurred while executing that command!' }, { quoted: msg });
      }
    }
  });
}

startBot();
