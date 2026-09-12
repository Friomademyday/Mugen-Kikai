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
    const helpText = `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩
⬩╭────────────╮ 
⬩                                ╰──────╯⬩
 
*𝑫𝒆𝒔𝒕𝒓𝒖𝒄𝒕𝒊𝒐𝒏 𝒊𝒔 𝒐𝒏𝒍𝒚 𝒋𝒖𝒔𝒕𝒊𝒇𝒊𝒂𝒃𝒍𝒆 𝒇𝒐𝒓 𝒓𝒆𝒎𝒐𝒅𝒆𝒍, 𝒏𝒆𝒗𝒆𝒓 𝒅𝒆𝒔𝒕𝒓𝒐𝒚, 𝑩𝒖𝒊𝒍𝒅/𝑪𝒓𝒆𝒂𝒕𝒆!*                                                      
                                               ~frio ⬩
‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎‎

⬩ ▬▬▬▬▬▬▬▬▬▬▬▬▬ ⬩
⬩ *C O M M A N D - M A N U A L* ⬩
⬩ ▬▬▬▬▬▬▬▬▬▬▬▬▬ ⬩


⬩╭────────────╮ 
⬩                                ╰──────╯⬩
▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗕 𝗢 𝗧
❏ *menu* - Launch the main visual system interface
❏ *help* - Display detailed functionality for all core commands
❏ *ping* - Check system connection latency and execution speed
❏ *runtime* - Display total active system uptime and memory state
❏ *owner* - Access core developer credentials and official links
❏ *updates* - View current patch version and deployment roadmaps


⬩╭────────────╮ 
⬩                                ╰──────╯⬩
▬▬▬▬▬▬▬▬▬ ⬩ 𝗨 𝗦 𝗘 𝗥
❏ *profile* - Fetch target operative details and bank account state


⬩╭────────────╮ 
⬩                                ╰──────╯⬩
▬▬▬▬▬▬▬ ⬩ 𝗘 𝗖 𝗢 𝗡 𝗢 𝗠 𝗬
❏ *firstclaim* - Claim one-time initial reserve allocation
❏ *claim* / *daily* - Collect standard daily economic yield
❏ *wallet* / *bal* - Check active cash holdings and bank deposits
❏ *deposit* / *dep* - Transfer cash from wallet into secure bank reserve
❏ *withdraw* / *with* - Retrieve cash from bank reserve to active wallet
❏ *give* / *pay* - Wire cash funds directly to another operative
❏ *rob* - Conduct standard cash heist against target operative
❏ *heavyrob* - Execute high-risk, high-reward liquidity operation
❏ *loan* - Request emergency liquidity bailout from bank reserve
❏ *leaderboard* / *lb* - View top net worth ranking hierarchy


⬩╭────────────╮ 
⬩                                ╰──────╯⬩
▬▬▬▬▬▬▬▬ ⬩ 𝗚 𝗔 𝗠 𝗕 𝗟 𝗘
❏ *gamble* - Place high-risk credit wager with multiplier outcome
❏ *coinflip* / *flip* - Fifty-percent double or nothing execution
❏ *slots* - Spin slot machine reels for high payout combinations
❏ *dice* / *roll* - High-low dice wagering against system house
❏ *blackjack* / *bj* - Single-hand instant blackjack card duel
❏ *roulette* - Bet on wheel sector targets for massive multiplier


⬩╭────────────╮ 
⬩                                ╰──────╯⬩
▬▬▬▬▬▬▬▬ ⬩ 𝗚 𝗥 𝗢 𝗨 𝗣
❏ *antilink* - Toggle automated external group link enforcement
❏ *antistatus* - Toggle anti-status broadcast mention protection
❏ *kick* - Evict target participant from active group sector
❏ *promote* - Escalate target participant to sector administrator
❏ *demote* - Revoke administrative clearance from target user
❏ *mute* - Restrict messaging rights exclusively to admins
❏ *unmute* - Restore standard group communication channels
❏ *tagall* - Issue broadcast mention to every sector member
❏ *hidetag* - Broadcast silent system message mentioning all


⬩╭────────────╮ 
⬩                                ╰──────╯⬩
▬▬▬▬▬▬▬ ⬩ 𝗦 𝗘 𝗖 𝗨 𝗥 𝗜 𝗧 𝗬
❏ *antilinkon* - Enable strict group link deletion and kick protocols
❏ *antilinkoff* - Disable group link enforcement core
❏ *antichannelon* - Enable WhatsApp channel link eviction rules
❏ *antichanneloff* - Disable channel link enforcement core
❏ *antistatuson* - Enable automated status broadcast mention eviction
❏ *antistatusoff* - Disable status broadcast mention eviction`;

    await sock.sendMessage(from, { text: helpText });
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
