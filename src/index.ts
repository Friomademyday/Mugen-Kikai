import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState 
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { CONFIG } from './config';
import { commands } from './commands';
import { connectDB } from './database/connect';

async function startBot() {
  
  await connectDB();

  const { state, saveCreds } = await useMultiFileAuthState('baileys_auth_info');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) startBot();
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

    const messageContent = 
      msg.message.conversation || 
      msg.message.extendedTextMessage?.text || 
      '';

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
