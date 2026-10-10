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
      const imageBuffer = fs.readFileSync(MENU_IMAGE_PATH);
      await sock.sendMessage(from, {
        image: imageBuffer,
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
▬▬▬▬▬▬▬▬▬ ⬩ 𝗗 𝗨 𝗘 𝗟
❏ *duel* - Challenge a tagged user to a card duel
❏ *accept* - Accept an active duel challenge
❏ *off1* - Select offense card for slot 1
❏ *off2* - Select offense card for slot 2
❏ *def1* - Equip defense move to Left Wing
❏ *def2* - Equip defense move to Right Wing


⬩╭────────────╮ 
⬩                                ╰──────╯⬩
▬▬▬▬▬▬▬▬▬ ⬩ 𝗖 𝗔 𝗥 𝗗 𝗦
❏ *buy* - Purchase a card from the shop
❏ *mycards* - Display your owned card collection
❏ *card* - Inspect detailed card statistics and moves
❏ *upgrade* - Upgrade an owned card to next level


⬩╭────────────╮ 
⬩                                ╰──────╯⬩
▬▬▬▬▬▬▬▬▬ ⬩ 𝗨 𝗦 𝗘 𝗥
❏ *profile* - Fetch target operative details and bank account state
❏ *rank* - Check your current rank (rank increases with battle wins.
❏ *rankleaderboard* - Displays top 5 users with the highest battle points universally.


⬩╭────────────╮ 
⬩                                ╰──────╯⬩
▬▬▬▬▬▬▬ ⬩ 𝗣 𝗢 𝗟 𝗜 𝗧 𝗜 𝗖 𝗦
❏ *election* - Check active election cycle status, phase timer and candidate count
❏ *buyform* - Purchase candidacy form during REGISTRATION (president/governor/hos)
❏ *candidates* - Display registered candidates grouped by office
❏ *vote* - Vote for a candidate during VOTING phase by @mention
❏ *hierarchy* - Displays current government structure and leadership
❏ *appoint* - Presidential appointment of Vice President
❏ *unappoint* - Dismiss active Vice President with 15-hour cooldown
❏ *treasury* - Check active official branch treasury balance and reserve
❏ *treasurywithdraw* - Withdraw available funds from state treasury to personal wallet


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
❏ *odds* - Custom risk multiplier wagering. Bet any amount and choose your target multiplier from 2x to 5x

> created by Frio`; 

    const helpImagePath = path.join(process.cwd(), 'assets', 'mugenhelp.jpg');

    if (fs.existsSync(helpImagePath)) {
      const imageBuffer = fs.readFileSync(helpImagePath);
      await sock.sendMessage(from, {
        image: imageBuffer,
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
      text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n▬▬▬▬ ⬩ 𝗦 𝗬 𝗦 𝗧 𝗘 𝗠  𝗣 𝗜 𝗡 𝗚\n\n⚡ Latency Speed: *${latency}ms*`
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
      text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n▬▬▬▬▬▬▬ ⬩ 𝗥 𝗨 𝗡 𝗧 𝗜 𝗠 𝗘\n\n⏱️ Active System Duration: *${metrics.runtime}*\n🧠 Memory Reserve: *${metrics.ramUsage}*`
    });
  }
};

export const ownerCommand: Command = {
  name: 'owner',
  description: 'Display bot owner contact details',
  aliases: ['creator', 'developer'],
  execute: async ({ sock, from }: CommandContext) => {
    const ownerText = `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n▬▬▬▬▬▬▬ ⬩ 𝗢 𝗪 𝗡 𝗘 𝗥\n\n👨‍💻 Creator: *frio*\n🐙 GitHub: *@Friomademyday*\n💬 Discord: https://discord.gg/kUSvNJ3M\n\n⚡ Mugen Kikai MD Core Operations`;
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
⬩                  *Ｄ Ｕ Ｅ Ｌ*                  ⬩
⬩╭────────────╮ 
⬩                                ╰──────╯⬩

This patch introduces a complete *card battle economy*. 
A *timed 4-stage cycle* that moves from challenge to offense selection to defense prep to combat. Players can *purchase, collect, and upgrade cards* with *scaled power per level*, and use them to duel for rank.
The ranking 1msg/XP system was cleared and XP was set to 0, 
XP is now based on duel wins

Once accepted, a *full tactical combat is activated with HP, Shield, and Battle XP*. 
The duel now has real consequences with strike-based forfeits, shield-first damage calculation, and a 3-minute match timer that decides winners by combined stats.

> More details on "help"`;

    if (fs.existsSync(whatsNewImagePath)) {
      const imageBuffer = fs.readFileSync(whatsNewImagePath);
      await sock.sendMessage(from, {
        image: imageBuffer,
        caption
      });
    } else {
      await sock.sendMessage(from, { text: caption });
    }
  }
};

export const updatesImagePath = path.join(process.cwd(), 'assets', 'mugenupdate.jpg');

export const updatesCommand: Command = {
  name: 'updates',
  description: 'Display system patch log and version status',
  aliases: ['version', 'changelog'],
  execute: async ({ sock, from }: CommandContext) => {
    const updateText = `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩
> _3rd Generation (v.3)_

This update focuses on stability, speed, and systems. Core commands were optimized for faster response time, economy balances were adjusted, and several bug fixes were pushed to prevent spam and command locks.

New systems have been added to expand gameplay and interaction, with improved database handling and cleaner UI responses. More features and quality of life improvements are in testing and will ship in the next cycle.

> Use _wn_/_whatsnew_ to see what's new`;

    if (fs.existsSync(updatesImagePath)) {
      const imageBuffer = fs.readFileSync(updatesImagePath);
      await sock.sendMessage(from, {
        image: imageBuffer,
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
        const response = await fetch(pfpUrl);
        const imageBuffer = Buffer.from(await response.arrayBuffer());

        await sock.sendMessage(from, {
          image: imageBuffer,
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
  whatsNewCommand,
  updatesCommand,
  profileCommand
];
