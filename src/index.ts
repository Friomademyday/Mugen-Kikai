import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState, 
  proto 
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { CONFIG } from './config';

async function startBot() {
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
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === 'open') {
      console.log('Mugen Kikai MD connected successfully!');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const from = msg.key.remoteJid || '';
    const messageContent = 
      msg.message.conversation || 
      msg.message.extendedTextMessage?.text || 
      '';

    
    if (!messageContent.startsWith(CONFIG.prefix)) return;


    const args = messageContent.slice(CONFIG.prefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    
    if (commandName === 'ping') {
      const start = Date.now();
      await sock.sendMessage(from, { text: 'Testing speed...' }, { quoted: msg });
      const latency = Date.now() - start;
      await sock.sendMessage(from, { text: `Pong! Latency is ${latency}ms` }, { quoted: msg });
    }
  });
}

startBot();
