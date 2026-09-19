import fs from 'fs';
import path from 'path';
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

> created by Frio`; 

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
      text: `▬▬▬▬ ⬩ 𝗦 𝗬 𝗦 𝗧 𝗘 𝗠  𝗣 𝗜 𝗡 𝗚\n\n⚡ Latency Speed: *${latency}ms*`
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

export const whatsNewImagePath = path.join(process.cwd(), 'assets', 'whatsnew.jpg');

export const whatsNewCommand: Command = {
  name: 'whatsnew',
  description: 'Display new updates and changes on the bot',
  aliases: ['wn'],
  execute: async ({ sock, from }: CommandContext) => {
    const caption = `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩
⬩╭────────────╮ 
⬩                                ╰──────╯⬩

𝑰𝒏𝒕𝒓𝒐𝒅𝒖𝒄𝒆𝒔:
⬩     *Ｄ Ｅ Ｍ Ｏ Ｃ Ｒ Ａ Ｃ Ｙ*    ⬩
⬩╭────────────╮ 
⬩                                ╰──────╯⬩

This patch introduces a complete *political economy*. 
The system now runs on a *timed election cycle* that moves from locked to registration to voting. Players can *purchase candidacy forms with in-game currency* with *limited slots per office*, campaign, and voters can fund votes directly from their wallet.

Once elected, a *full government hierarchy is activated with President, Vice President, Head of Security, and per-group Governors*. 
The President now has executive powers to appoint and dismiss, and every office now controls its own state treasury with a reserve-lock security to prevent total drain. 

> More details on "help`;

    if (fs.existsSync(whatsNewImagePath)) {
      const imageBuffer = fs.readFileSync(whatsNewImagePath);
      await sock.sendMessage(from, {
        image: imageBuffer,
        mimetype: 'image/jpeg',
        jpegThumbnail: imageBuffer.toString('base64'),
        caption
      });
    } else {
      await sock.sendMessage(from, { text: caption });
    }
  }
};

export const updatesImagePath = path.join(process.cwd(), 'assets', 'updates.jpg');

export const updatesCommand: Command = {
  name: 'updates',
  description: 'Display system patch log and version status',
  aliases: ['version', 'changelog'],
  execute: async ({ sock, from }: CommandContext) => {
    const updateText = `blank`;

    if (fs.existsSync(updatesImagePath)) {
      const imageBuffer = fs.readFileSync(updatesImagePath);
      await sock.sendMessage(from, {
        image: imageBuffer,
        mimetype: 'image/jpeg',
        jpegThumbnail: imageBuffer.toString('base64'),
        caption: updateText
      });
    } else {
      await sock.sendMessage(from, { text: updateText });
    }
  }
};

function getNetWorthTier(totalNet: number): string {
  if (totalNet >= 1_000_000_000_000_000) return 'Quadrillions';
  if (totalNet >= 1_000_000_000_000) return 'Trillions'; // <--- Added Trillions
  if (totalNet >= 1_000_000_000) return 'Billions';
  if (totalNet >= 1_000_000) return 'Millions';
  if (totalNet >= 10_000) return 'Tens of Thousands';
  if (totalNet >= 1_000) return 'Thousands';
  return 'Base Capital';
}

// Helper to find the user's true economy rank across ALL database records based on Bank balance
async function getUserEconomyRank(userJid: string): Promise<string> {
  const allUsers = await User.find({
    bank: { $lt: Number.MAX_SAFE_INTEGER, $gt: 0 }
  })
  .sort({ bank: -1 })
  .select('jid')
  .exec();

  const rankIndex = allUsers.findIndex(u => u.jid === userJid);
  if (rankIndex === -1) return 'Unranked';
  return `#${rankIndex + 1}`;
}

export const profileCommand: Command = {
  name: 'profile',
  description: 'View individual user record and bank account details',
  aliases: ['user', 'me'],
  execute: async ({ sock, sender, msg, from }: CommandContext) => {
    const user = await User.getOrCreate(sender);
    const pushName = msg.pushName || 'Operative';
    const totalNet = user.wallet + user.bank;
    
    const netTier = getNetWorthTier(totalNet);
    const economyRank = await getUserEconomyRank(user.jid || sender);

    const caption = `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩

⬩╭────────────╮
⬩                                ╰──────╯⬩
▬▬▬▬▬▬▬▬▬▬▬ ⬩ 𝗬 𝗢 𝗨  
❏ ɴᴀᴍᴇ: ${pushName}
❏ ɢʀᴏᴜᴘ ᴛᴀɢ: @${sender.split('@')[0]}

⬩╭────────────╮
⬩                                ╰──────╯⬩
▬▬▬▬▬▬▬ ⬩  𝗙 𝗜 𝗡 𝗔 𝗡 𝗖 𝗘

❏ ᴡᴀʟʟᴇᴛ: 🪙 ${user.wallet.toLocaleString()}
❏ ʙᴀɴᴋ: 🪙 ${user.bank.toLocaleString()}
❏ ɴᴇᴛ ᴡᴏʀᴛʜ: 🪙 ${totalNet.toLocaleString()} (${netTier})
❏ ᴇᴄᴏɴᴏᴍʏ ʀᴀɴᴋ: ${economyRank} on Lb

⬩╭────────────╮
⬩                                ╰──────╯⬩`;

    try {
      const pfpUrl = await sock.profilePictureUrl(sender, 'image');
      if (pfpUrl) {
        await sock.sendMessage(from, {
          image: { url: pfpUrl },
          caption,
          mentions: [sender]
        });
        return;
      }
    } catch (_) {}

    await sock.sendMessage(from, {
      text: caption,
      mentions: [sender]
    });
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
