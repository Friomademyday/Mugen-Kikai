import { PoliticalState } from '../database/models/PoliticalState';
import { User } from '../database/models/User';

export async function checkAndProcessElections(sock: any): Promise<void> {
  const state = await PoliticalState.getSystemState();
  const now = new Date();

  if (state.electionPhase === 'LOCKED') {
    if (now >= state.nextElectionDate) {
      state.electionPhase = 'REGISTRATION';
      state.phaseEndsAt = new Date(now.getTime() + 5 * 60 * 1000);
      state.candidates = [];
      await state.save();

      await broadcastMessage(sock, `⬩ 🗳️ 𝗘𝗟𝗘𝗖𝗧𝗜𝗢𝗡 𝗦𝗘𝗔𝗦𝗢𝗡\n\n📢 *ELECTION SEASON HAS OFFICIALLY OPENED!*\n\nCandidate registration forms are now available.\n⏳ Registration Window: *5 Minutes*\n\nUse *.buyform <president|governor|hos>* to register!`);
    }
  } else if (state.electionPhase === 'REGISTRATION') {
    if (state.phaseEndsAt && now >= state.phaseEndsAt) {
      state.electionPhase = 'VOTING';
      state.phaseEndsAt = new Date(now.getTime() + 2 * 60 * 1000);

      const candidateJids = state.candidates.map(c => c.jid);
      await User.updateMany({ jid: { $in: candidateJids } }, { custom03: true });
      await state.save();

      await broadcastMessage(sock, `⬩ 🗳️ 𝗘𝗟𝗘𝗖𝗧𝗜𝗢𝗡 𝗦𝗘𝗔𝗦𝗢𝗡\n\n🔒 *REGISTRATION CLOSED! VOTING IS NOW LIVE!*\n\nAll registered candidates' wallets have been frozen for safety.\n⏳ Voting Window: *2 Minutes*\n\nUse *.vote @candidate <amount>* to cast your votes!`);
    }
  } else if (state.electionPhase === 'VOTING') {
    if (state.phaseEndsAt && now >= state.phaseEndsAt) {
      await finalizeElections(sock, state);
    }
  }
}

async function finalizeElections(sock: any, state: any): Promise<void> {
  const candidateJids = state.candidates.map((c: any) => c.jid);
  await User.updateMany({ jid: { $in: candidateJids } }, { custom03: false });

  const presidentialCandidates = state.candidates.filter((c: any) => c.role === 'PRESIDENT');
  const hosCandidates = state.candidates.filter((c: any) => c.role === 'HOS');
  const governorCandidates = state.candidates.filter((c: any) => c.role === 'GOVERNOR');

  const declareWinner = (list: any[]) => {
    if (list.length === 0) return null;
    list.sort((a, b) => {
      if (b.votes !== a.votes) return b.votes - a.votes;
      if (a.lastVoteAt && b.lastVoteAt) return a.lastVoteAt.getTime() - b.lastVoteAt.getTime();
      return a.purchasedAt.getTime() - b.purchasedAt.getTime();
    });
    return list[0];
  };

  const presWinner = declareWinner(presidentialCandidates);
  if (presWinner) {
    state.presidentJid = presWinner.jid;
    state.vicePresidentJid = null;
  }

  const hosWinner = declareWinner(hosCandidates);
  if (hosWinner) {
    state.hosJid = hosWinner.jid;
  }

  const govGroups = Array.from(new Set(governorCandidates.map((c: any) => c.groupId)));
  for (const gId of govGroups) {
    const groupGovs = governorCandidates.filter((c: any) => c.groupId === gId);
    const govWinner = declareWinner(groupGovs);
    if (govWinner && gId) {
      state.governors.set(gId, govWinner.jid);
    }
  }

  const allWinners = [presWinner?.jid, hosWinner?.jid, ...Array.from(state.governors.values())].filter(Boolean);
  await User.updateMany({ jid: { $in: allWinners } }, { custom04: 'OFFICIAL' });

  state.electionPhase = 'LOCKED';
  state.phaseEndsAt = null;
  state.nextElectionDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
  state.candidates = [];
  await state.save();

  await broadcastMessage(sock, `▬▬▬▬▬ ⬩ 🏛️ 𝗘𝗟𝗘𝗖𝗧𝗜𝗢𝗡 𝗥𝗘𝗦𝗨𝗟𝗧𝗦\n\n🏆 *THE ELECTION HAS CONCLUDED!*\n\n👑 President: ${presWinner ? `@${presWinner.jid.split('@')[0]}` : 'Vacant'}\n🛡️ Head of Security: ${hosWinner ? `@${hosWinner.jid.split('@')[0]}` : 'Vacant'}\n\nCongratulations to the winners! Next elections run in 4 days.`);
}

async function broadcastMessage(sock: any, text: string): Promise<void> {
  try {
    const chats = await sock.groupFetchAllParticipating();
    for (const groupId of Object.keys(chats)) {
      await sock.sendMessage(groupId, { text }).catch(() => {});
    }
  } catch (err) {
    console.error('Broadcast failed:', err);
  }
                      }
