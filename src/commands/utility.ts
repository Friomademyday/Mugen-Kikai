import { Command } from './index';
import { getSystemMetrics } from '../utils/system';
import { User } from '../database/models/User';

export const menuCommand: Command = {
  name: 'menu',
  description: 'Display the main system interface menu',
  aliases: ['help', 'h', 'm'],
  execute: async ({ sock, from }) => {
    const metrics = await getSystemMetrics();

    const menuText = `
    blank 
    
    `;

    await sock.sendMessage(from, { text: menuText });
  }
};

export const pingCommand: Command = {
  name: 'ping',
  description: 'Check response speed and latency',
  execute: async ({ sock, from }) => {
    const start = Date.now();
    const sentMsg = await sock.sendMessage(from, { text: 'Testing latency...' });
    const latency = Date.now() - start;

    await sock.sendMessage(from, {
      text: `⚡ *Pong!* Response Latency: *${latency}ms*`
    }, { quoted: sentMsg });
  }
};

export const runtimeCommand: Command = {
  name: 'runtime',
  description: 'Check current active system duration',
  aliases: ['uptime'],
  execute: async ({ sock, from }) => {
    const metrics = await getSystemMetrics();
    await sock.sendMessage(from, {
      text: `⏱️ *SYSTEM RUNTIME*\n\nActive Uptime: *${metrics.runtime}*\nCurrent RAM Usage: *${metrics.ramUsage}*`
    });
  }
};

export const ownerCommand: Command = {
  name: 'owner',
  description: 'Display bot owner contact details',
  aliases: ['creator'],
  execute: async ({ sock, from }) => {
    await sock.sendMessage(from, {
      text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗢 𝗪 𝗡 𝗘 𝗥\n\nDeveloper: *Frio*\nCore Core: Mugen Kikai MD\nContact: Direct Administrator Channel`
    });
  }
};

export const updatesCommand: Command = {
  name: 'updates',
  description: 'Display system patch log and version status',
  aliases: ['changelog'],
  execute: async ({ sock, from }) => {
    await sock.sendMessage(from, {
      text: `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗨 𝗣 𝗗 𝗔 𝗧 𝗘 𝗦\n\nCurrent Core: *v2.4.0*\nSecurity Core: *Frioverse Enforcement v1.2*\nStatus: *All Systems Operational*`
    });
  }
};

export const profileCommand: Command = {
  name: 'profile',
  description: 'View individual user record and bank balances',
  aliases: ['user', 'me'],
  execute: async ({ sock, sender, from }) => {
    const user = await User.getOrCreate(sender);
    const text = `▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗣 𝗥 𝗢 𝗙 𝗜 𝗟 𝗘\n\nUser ID: @${sender.split('@')[0]}\nWallet: *$${user.wallet.toLocaleString()}*\nBank Reserve: *$${user.bank.toLocaleString()}*\nNet Worth: *$${(user.wallet + user.bank).toLocaleString()}*`;
    
    await sock.sendMessage(from, {
      text,
      mentions: [sender]
    });
  }
};

export const utilityCommands = [
  menuCommand,
  pingCommand,
  runtimeCommand,
  ownerCommand,
  updatesCommand,
  profileCommand
];
