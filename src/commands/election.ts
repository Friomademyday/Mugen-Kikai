import { Command } from '../types/command';
import { User } from '../database/models/User';
import { PoliticalState } from '../database/models/PoliticalState';

const FORM_PRICES = {
  PRESIDENT: 100000000,
  HOS: 70000000,
  GOVERNOR: 50000000
};

const VOTE_PRICES = {
  PRESIDENT: 5000,
  GOVERNOR: 2500,
  HOS: 2000
};

export const electionCommands: Command[] = [
  {
    name: 'election',
    aliases: ['elections', 'edate'],
    category: 'politics',
    description: 'Check active election cycle status and candidate count',
    execute: async (ctx) => {
      const state = await PoliticalState.getSystemState();
      const now = new Date();

      let text = `⬩ 🗳️ 𝗘𝗟𝗘𝗖𝗧𝗜𝗢𝗡 𝗜𝗡𝗙𝗢\n\n`;
      text += `📍 Phase: *${state.electionPhase}*\n`;

      if (state.electionPhase === 'LOCKED') {
        const diff = state.nextElectionDate.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        text += `⏳ Next Election In: *${hours}h ${mins}m*\n🔒 System Status: *Commands Locked*`;
      } else {
        const diff = state.phaseEndsAt ? state.phaseEndsAt.getTime() - now.getTime() : 0;
        const mins = Math.floor(Math.max(0, diff) / (1000 * 60));
        const secs = Math.floor((Math.max(0, diff) % (1000 * 60)) / 1000);
        text += `⏳ Time Remaining: *${mins}m ${secs}s*\n📋 Registered Candidates: *${state.candidates.length}*`;
      }

      await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
    }
  },

  {
    name: 'buyform',
    aliases: ['registerform'],
    category: 'politics',
    description: 'Purchase an election candidacy form during registration',
    execute: async (ctx) => {
      const state = await PoliticalState.getSystemState();

      if (state.electionPhase !== 'REGISTRATION') {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Registration is currently locked!` }, { quoted: ctx.msg });
        return;
      }

      const roleInput = ctx.args[0]?.toUpperCase();
      let role: 'PRESIDENT' | 'GOVERNOR' | 'HOS' | null = null;

      if (roleInput === 'PRESIDENT' || roleInput === 'PRES') role = 'PRESIDENT';
      else if (roleInput === 'GOVERNOR' || roleInput === 'GOV') role = 'GOVERNOR';
      else if (roleInput === 'HOS' || roleInput === 'SECURITY') role = 'HOS';

      if (!role) {
        await ctx.sock.sendMessage(ctx.from, { text: `Usage: *${ctx.command} <president|governor|hos>*` }, { quoted: ctx.msg });
        return;
      }

      const existingCandidate = state.candidates.find(c => c.jid === ctx.sender);
      if (existingCandidate) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ You have already purchased a form for ${existingCandidate.role}!` }, { quoted: ctx.msg });
        return;
      }

      if (role === 'PRESIDENT') {
        const count = state.candidates.filter(c => c.role === 'PRESIDENT').length;
        if (count >= 10) {
          await ctx.sock.sendMessage(ctx.from, { text: `❌ All 10 Presidential forms have been purchased!` }, { quoted: ctx.msg });
          return;
        }
      } else if (role === 'HOS') {
        const count = state.candidates.filter(c => c.role === 'HOS').length;
        if (count >= 10) {
          await ctx.sock.sendMessage(ctx.from, { text: `❌ All 10 HOS forms have been purchased!` }, { quoted: ctx.msg });
          return;
        }
      } else if (role === 'GOVERNOR') {
        const count = state.candidates.filter(c => c.role === 'GOVERNOR' && c.groupId === ctx.from).length;
        if (count >= 3) {
          await ctx.sock.sendMessage(ctx.from, { text: `❌ All 3 Governor forms for this group have been purchased!` }, { quoted: ctx.msg });
          return;
        }
      }

      const user = await User.getOrCreate(ctx.sender, ctx.pushName);
      const price = FORM_PRICES[role];

      if (user.wallet < price) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Insufficient funds! Form cost: *🪙${price.toLocaleString()}*` }, { quoted: ctx.msg });
        return;
      }

      user.wallet -= price;
      await user.save();

      state.candidates.push({
        jid: ctx.sender,
        pushName: ctx.pushName || 'Anonymous',
        role,
        groupId: role === 'GOVERNOR' ? ctx.from : null,
        purchasedAt: new Date(),
        votes: 0,
        lastVoteAt: null
      });

      await state.save();

      await ctx.sock.sendMessage(ctx.from, {
        text: `⬩ 🗳️ 𝗙𝗢𝗥𝗠 𝗣𝗨𝗥𝗖𝗛𝗔𝗦𝗘𝗗\n\n🎉 Candidate: *@${ctx.sender.split('@')[0]}*\n📜 Role: *${role}*\n💰 Paid: *🪙${price.toLocaleString()}*`,
        mentions: [ctx.sender]
      }, { quoted: ctx.msg });
    }
  },

  {
    name: 'candidates',
    aliases: ['candidateList'],
    category: 'politics',
    description: 'Display registered election candidates',
    execute: async (ctx) => {
      const state = await PoliticalState.getSystemState();

      if (state.candidates.length === 0) {
        await ctx.sock.sendMessage(ctx.from, { text: `📋 No registered candidates for this cycle yet.` }, { quoted: ctx.msg });
        return;
      }

      let text = `⬩ 🗳️ 𝗖𝗔𝗡𝗗𝗜𝗗𝗔𝗧𝗘 𝗥𝗘𝗚𝗜𝗦𝗧𝗥𝗬\n\n`;

      const pres = state.candidates.filter(c => c.role === 'PRESIDENT');
      const hos = state.candidates.filter(c => c.role === 'HOS');
      const gov = state.candidates.filter(c => c.role === 'GOVERNOR' && c.groupId === ctx.from);

      text += `👑 *PRESIDENTIAL CANDIDATES (${pres.length}/10):*\n`;
      pres.forEach((c, idx) => {
        text += `${idx + 1}. ${c.pushName} ${state.electionPhase === 'VOTING' ? `[Votes: ${c.votes}]` : '[Votes: Locked]'}\n`;
      });

      text += `\n🛡️ *HOS CANDIDATES (${hos.length}/10):*\n`;
      hos.forEach((c, idx) => {
        text += `${idx + 1}. ${c.pushName} ${state.electionPhase === 'VOTING' ? `[Votes: ${c.votes}]` : '[Votes: Locked]'}\n`;
      });

      text += `\n🏛️ *GOVERNOR CANDIDATES - THIS GROUP (${gov.length}/3):*\n`;
      gov.forEach((c, idx) => {
        text += `${idx + 1}. ${c.pushName} ${state.electionPhase === 'VOTING' ? `[Votes: ${c.votes}]` : '[Votes: Locked]'}\n`;
      });

      await ctx.sock.sendMessage(ctx.from, { text }, { quoted: ctx.msg });
    }
  },

  {
    name: 'vote',
    category: 'politics',
    description: 'Vote for a registered candidate during voting phase',
    execute: async (ctx) => {
      const state = await PoliticalState.getSystemState();

      if (state.electionPhase !== 'VOTING') {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Voting is currently closed!` }, { quoted: ctx.msg });
        return;
      }

      let targetJid: string | null = null;
      if (ctx.msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        targetJid = ctx.msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
      }

      if (!targetJid) {
        await ctx.sock.sendMessage(ctx.from, { text: `Usage: *${ctx.command} @candidate <voteCount>*` }, { quoted: ctx.msg });
        return;
      }

      if (targetJid === ctx.sender) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Candidates cannot vote for themselves!` }, { quoted: ctx.msg });
        return;
      }

      const candidate = state.candidates.find(c => c.jid === targetJid && (c.role !== 'GOVERNOR' || c.groupId === ctx.from));
      if (!candidate) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Mentioned user is not running for office in this domain!` }, { quoted: ctx.msg });
        return;
      }

      const voteCount = parseInt(ctx.args[1] || ctx.args[0], 10);
      if (isNaN(voteCount) || voteCount <= 0) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Enter a valid vote quantity.` }, { quoted: ctx.msg });
        return;
      }

      const costPerVote = VOTE_PRICES[candidate.role];
      const totalCost = voteCount * costPerVote;

      const voter = await User.getOrCreate(ctx.sender);
      if (voter.wallet < totalCost) {
        await ctx.sock.sendMessage(ctx.from, { text: `❌ Insufficient balance! ${voteCount} votes cost *🪙${totalCost.toLocaleString()}*` }, { quoted: ctx.msg });
        return;
      }

      voter.wallet -= totalCost;
      candidate.votes += voteCount;
      candidate.lastVoteAt = new Date();

      await voter.save();
      await state.save();

      await ctx.sock.sendMessage(ctx.from, {
        text: `⬩ 🗳️ 𝗩𝗢𝗧𝗘 𝗖𝗔𝗦𝗧\n\n🎯 Candidate: *@${targetJid.split('@')[0]}*\n📥 Votes Added: *+${voteCount.toLocaleString()}*\n💰 Total Cost: *🪙${totalCost.toLocaleString()}*`,
        mentions: [targetJid]
      }, { quoted: ctx.msg });
    }
  }
];
