import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState 
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { CONFIG } from './config';
import { commands } from './commands';
import { connectDB } from './database/connect';
import { GroupModel } from './database/models/Group';
import { WarnModel } from './database/models/Warn';

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

    if (isGroup) {
      const groupSettings = await GroupModel.findOne({ jid: from });

      if (groupSettings) {
        const isLink = /(https?:\/\/[^\s]+|chat\.whatsapp\.com\/[^\s]+|wa\.me\/[^\s]+)/gi.test(messageContent);
        
        const isStatusMention = msg.message?.groupMentionedMessage || 
          msg.message?.extendedTextMessage?.contextInfo?.remoteJid === 'status@broadcast' ||
          messageContent.includes('status@broadcast');

        let triggeredViolation = false;

        if (groupSettings.antilink && isLink) triggeredViolation = true;
        if (groupSettings.antistatus && isStatusMention) triggeredViolation = true;

        if (triggeredViolation) {
          await sock.sendMessage(from, { delete: msg.key });

          let warnRecord = await WarnModel.findOne({ groupJid: from, userJid: sender });
          if (!warnRecord) {
            warnRecord = await WarnModel.create({ groupJid: from, userJid: sender, warnings: 0 });
          }

          warnRecord.warnings += 1;
          await warnRecord.save();

          if (warnRecord.warnings >= 2) {
            await sock.sendMessage(from, { 
              text: `@${sender.split('@')[0]} reached 2 warnings for rule violations and was removed.`, 
              mentions: [sender] 
            });
            await sock.groupParticipantsUpdate(from, [sender], 'remove');
            await WarnModel.deleteOne({ groupJid: from, userJid: sender });
          } else {
            await sock.sendMessage(from, { 
              text: `Warning 1/2 for @${sender.split('@')[0]}! Repeat violations will trigger an automatic kick.`, 
              mentions: [sender] 
            });
          }
          return;
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
