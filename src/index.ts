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
import { User } from './database/models/User';
import { handleSecretTriggers } from './utils/secret';
import fs from 'fs';
import path from 'path';
import pino from 'pino';
import { checkAndProcessElections } from './services/electionScheduler';

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
let electionInterval: NodeJS.Timeout | null = null;

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
    keepAliveIntervalMs: 30000
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
      if (electionInterval) {
        clearInterval(electionInterval);
        electionInterval = null;
      }
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

      if (!electionInterval) {
        electionInterval = setInterval(() => {
          checkAndProcessElections(sock).catch((err) => {
            console.error('Error running election check loop:', err);
          });
        }, 10000);
      }
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
