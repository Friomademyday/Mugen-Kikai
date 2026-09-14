import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  WASocket,
  WAMessage,
  Browsers
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
import pino from 'pino';
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

let isConnecting = false;

async function startBot() {
  if (isConnecting) return;
  isConnecting = true;

  await connectDB();

  const authFolder = path.join(__dirname, '..', 'baileys_auth_info');
  if (!fs.existsSync(authFolder)) {
    fs.mkdirSync(authFolder, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(authFolder);

  const sock = makeWASocket({
    auth: state,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    browser: Browsers.ubuntu('Chrome'),
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 0,
    keepAliveIntervalMs: 30000,
    retryRequestOptions: {
      maxRetries: 5,
      delayMs: 2000
    }
  });

  sock.ev.on('creds.update', saveCreds);

  if (!sock.authState.creds.registered) {
    const rawNumber = process.env.OWNER_NUMBER || CONFIG.ownerNumber || '';
    const phoneNumber = rawNumber.replace(/[^0-9]/g, '');

    if (phoneNumber) {
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(phoneNumber);
          console.log(`\n========================================`);
          console.log(`YOUR WHATSAPP PAIRING CODE: ${code}`);
          console.log(`========================================\n`);
        } catch (err) {
          console.error('Failed to request pairing code:', err);
        }
      }, 5000);
    } else {
      console.error('ERROR: OWNER_NUMBER environment variable is missing or empty!');
    }
  }

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      isConnecting = false;
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      console.log(`Connection closed (status: ${statusCode}), reconnecting: ${shouldReconnect}`);
      
      if (shouldReconnect) {
        setTimeout(() => startBot(), 5000);
      } else {
        console.log('Logged out or session invalid. Resetting auth folder...');
        try {
          if (fs.existsSync(authFolder)) {
            fs.rmSync(authFolder, { recursive: true, force: true });
          }
          fs.mkdirSync(authFolder, { recursive: true });
        } catch (e) {
          console.error('Error handling auth directory cleanup:', e);
        }
        setTimeout(() => startBot(), 5000);
      }
    } else if (connection === 'open') {
      isConnecting = false;
      console.log('Mugen Kikai MD connected successfully!');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg || !msg.message || msg.key.fromMe) return;

    const rawFrom = msg.key.remoteJid || '';
    const sender = msg.key.participant || msg.key.remoteJid || '';
    const isGroup = rawFrom.endsWith('@g.us');
    const pushName = msg.pushName || undefined;

    const from = isGroup ? rawFrom.split('@')[0].split(':')[0] + '@g.us' : rawFrom;

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
      const isChannelLink = /whatsapp\.com\/channel\/[^\s]+/gi.test(messageContent);
      const isGroupLink = /chat\.whatsapp\.com\/[^\s]+/gi.test(messageContent);
      const isAnyUrl = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|io|me|co|app|xyz|tech)(\/[^\s]*)?)/gi.test(messageContent);
      
      const contextInfo = 
        msg.message?.extendedTextMessage?.contextInfo || 
        msg.message?.imageMessage?.contextInfo || 
        msg.message?.videoMessage?.contextInfo ||
        msg.message?.documentMessage?.contextInfo;

      const isStatusMention = 
        Boolean(msg.message?.groupMentionedMessage) ||
        contextInfo?.remoteJid === 'status@broadcast' ||
        (Array.isArray(contextInfo?.mentionedJid) && contextInfo.mentionedJid.includes('status@broadcast')) ||
        messageContent.includes('status@broadcast');

      const antilinkOn = (antilinkState.get(from) || 0) === 1;
      const antichannelOn = (antichannelState.get(from) || 0) === 1;
      const antistatusOn = (antistatusState.get(from) || 0) === 1;
      const antialllinkOn = (antialllinkState.get(from) || 0) === 1;

      let violationType = '';

      if (antialllinkOn && isAnyUrl) {
        violationType = 'Unauthorized External URL / Link';
      } else if (antichannelOn && isChannelLink) {
        violationType = 'Unauthorized WhatsApp Channel Link';
      } else if (antilinkOn && isGroupLink) {
        let isOwnGroupLink = false;
        const inviteCodeMatch = messageContent.match(/chat\.whatsapp\.com\/([a-zA-Z0-9–_]+)/);
        if (inviteCodeMatch && inviteCodeMatch[1]) {
          try {
            const currentInvite = await sock.groupInviteCode(from);
            if (currentInvite === inviteCodeMatch[1]) {
              isOwnGroupLink = true;
            }
          } catch (_) {}
        }
        if (!isOwnGroupLink) {
          violationType = 'Unauthorized Group Invite Link';
        }
      } else if (antistatusOn && isStatusMention) {
        violationType = 'Unauthorized Status Broadcast Mention';
      }

      if (violationType) {
        const metadata = await sock.groupMetadata(from);
        
        const extractId = (jid?: string) => jid ? jid.split('@')[0].split(':')[0] : '';
        const botId = extractId(sock.user?.id);
        const senderId = extractId(sender);

        const botIsAdmin = metadata.participants.some(p => 
          extractId(p.id) === botId && (p.admin === 'admin' || p.admin === 'superadmin')
        );

        if (botIsAdmin) {
          const senderIsAdmin = metadata.participants.some(p => 
            extractId(p.id) === senderId && (p.admin === 'admin' || p.admin === 'superadmin')
          );

          if (!senderIsAdmin) {
            await sock.sendMessage(from, { delete: msg.key }).catch(() => {});

            await sock.sendMessage(from, {
              text: `▬▬▬▬▬ ⬩ 𝗙 𝗥 𝗜 𝗢 𝗩 𝗘 𝗥 𝗦 𝗘\n\n🚨 *SECURITY ENFORCEMENT*\n\nUser: @${senderId}\nViolation: *${violationType}*\n\n⚡ Action Executed: *Instant Eviction*`,
              mentions: [sender]
            }).catch(() => {});

            await sock.groupParticipantsUpdate(from, [sender], 'remove').catch(() => {});
            return;
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
