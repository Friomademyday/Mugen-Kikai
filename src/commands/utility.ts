import fs from 'fs';
import { CommandContext } from '../index';
import { getFormattedMenu, MENU_IMAGE_PATH } from '../utils/menuText';
import { getSystemMetrics } from '../utils/system';
import { User } from '../database/models/User';

export interface Command {
  name: string;
  description: string;
  aliases?: string[];
  execute: (ctx: CommandContext) => Promise<void>;
}

export const menuCommand: Command = {
  name: 'menu',
  description: 'Display the main system interface menu',
  aliases: ['m'],
  execute: async ({ sock, from }: CommandContext) => {
    const caption = await getFormattedMenu();

    if (MENU_IMAGE_PATH && fs.existsSync(MENU_IMAGE_PATH)) {
      await sock.sendMessage(from, {
        image: { url: MENU_IMAGE_PATH },
        caption
      });
    } else {
      await sock.sendMessage(from, { text: caption });
    }
  }
};

export const helpCommand: Command = {
  name: 'help',
  description: 'List all commands and their function descriptions',
  aliases: ['h', 'commands'],
  execute: async ({ sock, from }: CommandContext) => {
    const helpText = `...`; 

    const helpImagePath = path.join(process.cwd(), 'assets', 'mugenhelp.jpg');

    if (fs.existsSync(helpImagePath)) {
      await sock.sendMessage(from, {
        image: { url: helpImagePath },
        caption: helpText
      });
    } else {
      await sock.sendMessage(from, { text: helpText });
    }
  }
};

export const pingCommand: Command = {
  name: 'ping',
  description: 'Check response speed and latency',
  execute: async ({ sock, from }: CommandContext) => {
    const start = Date.now();
    const sentMsg = await sock.sendMessage(from, { text: '⚡ *Mugen Kikai pinging system...*' });
    const latency = Date.now() - start;

    await sock.sendMessage(from, {
      text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗦 𝗬 𝗦 𝗧 𝗘 𝗠  𝗣 𝗜 𝗡 𝗚\n\n⚡ Latency Speed: *${latency}ms*`
    }, { quoted: sentMsg });
  }
};

export const runtimeCommand: Command = {
  name: 'runtime',
  description: 'Check current active system duration',
  aliases: ['uptime'],
  execute: async ({ sock, from }: CommandContext) => {
    const metrics = await getSystemMetrics();
    await sock.sendMessage(from, {
      text: `▬▬▬▬▬▬▬ ⬩ 𝗥 𝗨 𝗡 𝗧 𝗜 𝗠 𝗘\n\n⏱️ Active System Duration: *${metrics.runtime}*\n🧠 Memory Reserve: *${metrics.ramUsage}*`
    });
  }
};

export const ownerCommand: Command = {
  name: 'owner',
  description: 'Display bot owner contact details',
  aliases: ['creator', 'developer'],
  execute: async ({ sock, from }: CommandContext) => {
    const ownerText = `▬▬▬▬▬▬▬ ⬩ 𝗢 𝗪 𝗡 𝗘 𝗥\n\n👨‍💻 Creator: *frio*\n🐙 GitHub: *@Friomademyday*\n💬 Discord: https://discord.gg/kUSvNJ3M\n\n⚡ Mugen Kikai MD Core Operations`;
    await sock.sendMessage(from, { text: ownerText });
  }
};

export const updatesCommand: Command = {
  name: 'updates',
  description: 'Display system patch log and version status',
  aliases: ['version', 'changelog'],
  execute: async ({ sock, from }: CommandContext) => {
    const updateText = `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗨 𝗣 𝗗 𝗔 𝗧 𝗘 𝗦\n\n🤖 Core Bot: *Mugen Kikai*\n🔖 Current Version: *v2.0*\n\n📋 *Patch Notes:*\n• Security Core enforcement fully integrated.\n• Complete economy and gambling matrix operational.\n\n🚀 *Future Pushes:*\n• Expanded economic commands, market systems, and specialized RPG structures coming in upcoming builds.`;
    await sock.sendMessage(from, { text: updateText });
  }
};

export const profileCommand: Command = {
  name: 'profile',
  description: 'View individual user record and bank account details',
  aliases: ['user', 'me'],
  execute: async ({ sock, sender, msg, from }: CommandContext) => {
    const user = await User.getOrCreate(sender);
    const pushName = msg.pushName || 'Operative';
    const totalNet = user.wallet + user.bank;

    const caption = `▬▬▬▬▬▬▬ ⬩ 𝗣 𝗥 𝗢 𝗙 𝗜 𝗟 𝗘\n\n👤 Name: *${pushName}*\n🆔 Tag: @${sender.split('@')[0]}\n\n💳 *ACCOUNT DETAILS*\n💵 Wallet: *$${user.wallet.toLocaleString()}*\n🏦 Bank Reserve: *$${user.bank.toLocaleString()}*\n📈 Total Net Worth: *$${totalNet.toLocaleString()}*`;

    try {
      const pfpUrl = await sock.profilePictureUrl(sender, 'image');
      if (pfpUrl) {
        await sock.sendMessage(from, {
          image: { url: pfpUrl },
          caption,
          mentions: [sender]
        });
      } else {
        await sock.sendMessage(from, {
          text: caption,
          mentions: [sender]
        });
      }
    } catch (_) {
      await sock.sendMessage(from, {
        text: caption,
        mentions: [sender]
      });
    }
  }
};

export const utilityCommands = [
  menuCommand,
  helpCommand,
  pingCommand,
  runtimeCommand,
  ownerCommand,
  updatesCommand,
  profileCommand
];
