import { WASocket } from '@whiskeysockets/baileys';
import { User } from '../database/models/User';
import { cardLoader } from './cardLoader';
import { addDuelWinAndCheckRank } from './rankService';
import { CardMove, CharacterJSON } from '../types/card';

export type DuelPhase = 'CHALLENGE' | 'OFFENSE_SELECTION' | 'DEFENSE_SELECTION' | 'COMBAT' | 'ENDED';

export interface PlayerCombatState {
  jid: string;
  pushName: string;
  hp: number;
  shield: number;
  bxp: number;
  offenseCards: Array<{ character: CharacterJSON; level: number }>;
  leftWingDefense?: { character: CharacterJSON; move: CardMove; shieldValue: number; level: number };
  rightWingDefense?: { character: CharacterJSON; move: CardMove; shieldValue: number; level: number };
  strikes: number;
}

export interface ActiveDuel {
  duelId: string;
  groupId: string;
  challengerJid: string;
  challengedJid: string;
  phase: DuelPhase;
  currentTurnJid: string;
  playerA: PlayerCombatState;
  playerB: PlayerCombatState;
  phaseTimer: NodeJS.Timeout | null;
  turnTimer: NodeJS.Timeout | null;
  matchTimer: NodeJS.Timeout | null;
  bxpInterval: NodeJS.Timeout | null;
}

class DuelManager {
  private activeDuels: Map<string, ActiveDuel> = new Map();

  public getDuelById(duelId: string): ActiveDuel | undefined {
    return this.activeDuels.get(duelId);
  }

  public getActiveDuelForUser(userJid: string): ActiveDuel | undefined {
    for (const duel of this.activeDuels.values()) {
      if (duel.phase !== 'ENDED') {
        if (duel.challengerJid === userJid || duel.challengedJid === userJid) {
          return duel;
        }
      }
    }
    return undefined;
  }

  public isUserInDuel(userJid: string): boolean {
    return this.getActiveDuelForUser(userJid) !== undefined;
  }

  public async initiateChallenge(
    groupId: string,
    challengerJid: string,
    challengedJid: string,
    challengerPushName: string,
    challengedPushName: string,
    sock: WASocket
  ): Promise<boolean> {
    if (this.isUserInDuel(challengerJid) || this.isUserInDuel(challengedJid)) {
      await sock.sendMessage(groupId, { 
        text: '⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nOne of the participants is already engaged in an active duel!' 
      });
      return false;
    }

    const userA = await User.getOrCreate(challengerJid, challengerPushName);
    const userB = await User.getOrCreate(challengedJid, challengedPushName);

    const hasOffenseA = userA.inventory.some((inv) => {
      const card = cardLoader.getCard(inv.character_id);
      return card && card.character_type === 'offense';
    });

    const hasOffenseB = userB.inventory.some((inv) => {
      const card = cardLoader.getCard(inv.character_id);
      return card && card.character_type === 'offense';
    });

    if (!hasOffenseA || !hasOffenseB) {
      await sock.sendMessage(groupId, {
        text: '⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nBoth players must own at least 1 Offense card to participate in a duel!'
      });
      return false;
    }

    const duelId = `duel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const duelState: ActiveDuel = {
      duelId,
      groupId,
      challengerJid,
      challengedJid,
      phase: 'CHALLENGE',
      currentTurnJid: challengedJid,
      playerA: {
        jid: challengerJid,
        pushName: challengerPushName || 'Shinobi A',
        hp: 100,
        shield: 0,
        bxp: 10,
        offenseCards: [],
        strikes: 0
      },
      playerB: {
        jid: challengedJid,
        pushName: challengedPushName || 'Shinobi B',
        hp: 100,
        shield: 0,
        bxp: 10,
        offenseCards: [],
        strikes: 0
      },
      phaseTimer: null,
      turnTimer: null,
      matchTimer: null,
      bxpInterval: null
    };

    duelState.phaseTimer = setTimeout(async () => {
      await this.handleChallengeTimeout(duelId, sock);
    }, 15000);

    this.activeDuels.set(duelId, duelState);

    const challengerTag = `@${challengerJid.split('@')[0]}`;
    const challengedTag = `@${challengedJid.split('@')[0]}`;

    await sock.sendMessage(groupId, {
      text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\n${challengerTag} (${duelState.playerA.pushName}) HAS CHALLENGED ${challengedTag} (${duelState.playerB.pushName}) TO A CARD DUEL!\n\nType "accept" within 15 seconds to enter battle!`,
      mentions: [challengerJid, challengedJid]
    });

    return true;
  }

  private async handleChallengeTimeout(duelId: string, sock: WASocket): Promise<void> {
    const duel = this.activeDuels.get(duelId);
    if (duel && duel.phase === 'CHALLENGE') {
      this.clearDuelTimers(duel);
      this.activeDuels.delete(duelId);
      const challengedTag = `@${duel.challengedJid.split('@')[0]}`;
      await sock.sendMessage(duel.groupId, {
        text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nChallenge expired! ${challengedTag} failed to accept in time. Duel canceled.`,
        mentions: [duel.challengedJid]
      });
    }
  }

  public async acceptChallenge(groupId: string, userJid: string, sock: WASocket): Promise<void> {
    const duel = this.getActiveDuelForUser(userJid);
    if (!duel || duel.phase !== 'CHALLENGE' || duel.challengedJid !== userJid) {
      return;
    }

    if (duel.phaseTimer) clearTimeout(duel.phaseTimer);
    duel.phase = 'OFFENSE_SELECTION';

    duel.phaseTimer = setTimeout(async () => {
      await this.handleOffenseSelectionTimeout(duel.duelId, sock);
    }, 30000);

    await sock.sendMessage(groupId, {
      text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nCHALLENGE ACCEPTED!\n\nSTAGE 2: OFFENSE DECK SELECTION (30s)\nBoth players must select up to 2 Offense cards from their inventory.\n\nCommands:\n- off1-<card_id>\n- off2-<card_id>\nExample: off1-revy\n\nNote: Failure to select at least 1 Offense card within 30s will result in immediate forfeit!`,
      mentions: [duel.challengerJid, duel.challengedJid]
    });
  }

  public async selectOffenseCard(
    groupId: string,
    userJid: string,
    slot: 1 | 2,
    characterId: string,
    sock: WASocket
  ): Promise<void> {
    const duel = this.getActiveDuelForUser(userJid);
    if (!duel || duel.phase !== 'OFFENSE_SELECTION') return;

    const isPlayerA = duel.challengerJid === userJid;
    const isPlayerB = duel.challengedJid === userJid;
    if (!isPlayerA && !isPlayerB) return;

    const playerState = isPlayerA ? duel.playerA : duel.playerB;
    const user = await User.getOrCreate(userJid);
    const userTag = `@${userJid.split('@')[0]}`;

    const invItem = user.inventory.find((i) => i.character_id.toLowerCase() === characterId.toLowerCase());
    if (!invItem) {
      await sock.sendMessage(groupId, {
        text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\n${userTag}, you do not own the card "${characterId}"!`,
        mentions: [userJid]
      });
      return;
    }

    const card = cardLoader.getCard(characterId);
    if (!card || card.character_type !== 'offense') {
      await sock.sendMessage(groupId, {
        text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\n${userTag}, "${characterId}" is not a valid Offense card!`,
        mentions: [userJid]
      });
      return;
    }

    if (slot === 1) {
      playerState.offenseCards[0] = { character: card, level: invItem.level };
    } else {
      playerState.offenseCards[1] = { character: card, level: invItem.level };
    }

    await sock.sendMessage(groupId, {
      text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\n${userTag} locked in ${card.name} (Lvl ${invItem.level}) for Offense Slot ${slot}!`,
      mentions: [userJid]
    });

    if (duel.playerA.offenseCards.length >= 1 && duel.playerB.offenseCards.length >= 1) {
      this.transitionToDefenseSelection(duel.duelId, sock);
    }
  }

  private async handleOffenseSelectionTimeout(duelId: string, sock: WASocket): Promise<void> {
    const duel = this.activeDuels.get(duelId);
    if (!duel || duel.phase !== 'OFFENSE_SELECTION') return;

    const playerAHas = duel.playerA.offenseCards.length > 0;
    const playerBHas = duel.playerB.offenseCards.length > 0;

    const challengerTag = `@${duel.challengerJid.split('@')[0]}`;
    const challengedTag = `@${duel.challengedJid.split('@')[0]}`;

    if (!playerAHas && !playerBHas) {
      await sock.sendMessage(duel.groupId, { text: '⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nNeither player selected an Offense card! Duel forfeited.' });
      this.clearDuelTimers(duel);
      this.activeDuels.delete(duelId);
    } else if (!playerAHas) {
      await sock.sendMessage(duel.groupId, {
        text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ⬩ ${challengerTag} failed to select an Offense card! ${challengedTag} WINS BY FORFEIT!`,
        mentions: [duel.challengerJid, duel.challengedJid]
      });
      await addDuelWinAndCheckRank(duel.challengedJid, duel.groupId, sock);
      this.clearDuelTimers(duel);
      this.activeDuels.delete(duelId);
    } else if (!playerBHas) {
      await sock.sendMessage(duel.groupId, {
        text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\n${challengedTag} failed to select an Offense card! ${challengerTag} WINS BY FORFEIT!`,
        mentions: [duel.challengerJid, duel.challengedJid]
      });
      await addDuelWinAndCheckRank(duel.challengerJid, duel.groupId, sock);
      this.clearDuelTimers(duel);
      this.activeDuels.delete(duelId);
    } else {
      this.transitionToDefenseSelection(duelId, sock);
    }
  }

  private async transitionToDefenseSelection(duelId: string, sock: WASocket): Promise<void> {
    const duel = this.activeDuels.get(duelId);
    if (!duel) return;

    if (duel.phaseTimer) clearTimeout(duel.phaseTimer);
    duel.phase = 'DEFENSE_SELECTION';

    duel.phaseTimer = setTimeout(async () => {
      await this.transitionToCombat(duelId, sock);
    }, 30000);

    await sock.sendMessage(duel.groupId, {
      text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nSTAGE 3: DUAL-WING DEFENSE PREP (30s)\nEquip defense moves to build your starting shield using owned Defense cards!\n\nCommands:\n- def1-<move_id>\n- def2-<move_id>\nExample: def1-infinity\n\nNote: Duplicate defense moves across wings are blocked. If skipped, starting shield defaults to 0.`
    });
  }

  public async selectDefenseMove(
    groupId: string,
    userJid: string,
    wing: 1 | 2,
    moveId: string,
    sock: WASocket
  ): Promise<void> {
    const duel = this.getActiveDuelForUser(userJid);
    if (!duel || duel.phase !== 'DEFENSE_SELECTION') return;

    const isPlayerA = duel.challengerJid === userJid;
    const isPlayerB = duel.challengedJid === userJid;
    if (!isPlayerA && !isPlayerB) return;

    const playerState = isPlayerA ? duel.playerA : duel.playerB;
    const user = await User.getOrCreate(userJid);
    const userTag = `@${userJid.split('@')[0]}`;

    let matchedCard: CharacterJSON | null = null;
    let matchedMove: CardMove | null = null;
    let cardLevel = 1;

    for (const inv of user.inventory) {
      const card = cardLoader.getCard(inv.character_id);
      if (card && card.character_type === 'defense') {
        const foundMove = card.moves.find((m) => m.move_id.toLowerCase() === moveId.toLowerCase());
        if (foundMove) {
          matchedCard = card;
          matchedMove = foundMove;
          cardLevel = inv.level;
          break;
        }
      }
    }

    if (!matchedCard || !matchedMove) {
      await sock.sendMessage(groupId, {
        text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\n${userTag}, move "${moveId}" was not found among your owned Defense cards!`,
        mentions: [userJid]
      });
      return;
    }

    if (wing === 1 && playerState.rightWingDefense?.move.move_id === matchedMove.move_id) {
      await sock.sendMessage(groupId, { text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nDuplicate defense moves are not allowed across wings!` });
      return;
    }
    if (wing === 2 && playerState.leftWingDefense?.move.move_id === matchedMove.move_id) {
      await sock.sendMessage(groupId, { text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nDuplicate defense moves are not allowed across wings!` });
      return;
    }

    const calculatedShield = cardLoader.calculateScaledPoints(matchedMove.base_points, cardLevel);

    if (wing === 1) {
      playerState.leftWingDefense = {
        character: matchedCard,
        move: matchedMove,
        shieldValue: calculatedShield,
        level: cardLevel
      };
    } else {
      playerState.rightWingDefense = {
        character: matchedCard,
        move: matchedMove,
        shieldValue: calculatedShield,
        level: cardLevel
      };
    }

    playerState.shield =
      (playerState.leftWingDefense?.shieldValue || 0) + (playerState.rightWingDefense?.shieldValue || 0);

    await sock.sendMessage(groupId, {
      text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ⬩ ${userTag} equipped ${matchedMove.name} for Wing ${wing}! (+${calculatedShield} Shield)`,
      mentions: [userJid]
    });
  }

  private async transitionToCombat(duelId: string, sock: WASocket): Promise<void> {
    const duel = this.activeDuels.get(duelId);
    if (!duel) return;

    if (duel.phaseTimer) clearTimeout(duel.phaseTimer);
    duel.phase = 'COMBAT';
    duel.currentTurnJid = duel.challengedJid;

    duel.bxpInterval = setInterval(() => {
      if (duel.playerA.bxp < 10) duel.playerA.bxp += 1;
      if (duel.playerB.bxp < 10) duel.playerB.bxp += 1;
    }, 1000);

    duel.matchTimer = setTimeout(async () => {
      await this.handleMatchTimeExpired(duelId, sock);
    }, 180000);

    this.startTurnTimer(duelId, sock);

    await this.broadcastCombatState(duelId, sock, '⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nSTAGE 4: COMBAT PHASE STARTED!\nChallenged player goes first!');
  }

  private startTurnTimer(duelId: string, sock: WASocket): void {
    const duel = this.activeDuels.get(duelId);
    if (!duel || duel.phase !== 'COMBAT') return;

    if (duel.turnTimer) clearTimeout(duel.turnTimer);

    duel.turnTimer = setTimeout(async () => {
      await this.handleTurnTimeout(duelId, sock);
    }, 30000);
  }

  private async handleTurnTimeout(duelId: string, sock: WASocket): Promise<void> {
    const duel = this.activeDuels.get(duelId);
    if (!duel || duel.phase !== 'COMBAT') return;

    const activePlayer = duel.currentTurnJid === duel.challengerJid ? duel.playerA : duel.playerB;
    const inactivePlayerJid = duel.currentTurnJid === duel.challengerJid ? duel.challengedJid : duel.challengerJid;

    activePlayer.strikes += 1;

    const activeTag = `@${activePlayer.jid.split('@')[0]}`;
    const inactiveTag = `@${inactivePlayerJid.split('@')[0]}`;

    if (activePlayer.strikes >= 2) {
      await sock.sendMessage(duel.groupId, {
        text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\n${activeTag} accumulated 2 Turn Strikes (AFK)! AUTO-FORFEIT!\n\n🏆 WINNER: ${inactiveTag}!`,
        mentions: [activePlayer.jid, inactivePlayerJid]
      });
      await addDuelWinAndCheckRank(inactivePlayerJid, duel.groupId, sock);
      this.clearDuelTimers(duel);
      this.activeDuels.delete(duelId);
    } else {
      await sock.sendMessage(duel.groupId, {
        text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\n${activeTag} ran out of time! Strike 1! Turn Skipped.`,
        mentions: [activePlayer.jid]
      });
      duel.currentTurnJid = inactivePlayerJid;
      this.startTurnTimer(duelId, sock);
      await this.broadcastCombatState(duelId, sock, 'Turn skipped due to timeout!');
    }
  }

  public async executeMove(groupId: string, userJid: string, moveId: string, sock: WASocket): Promise<void> {
    const duel = this.getActiveDuelForUser(userJid);
    if (!duel || duel.phase !== 'COMBAT') return;

    const currentTurnTag = `@${duel.currentTurnJid.split('@')[0]}`;

    if (duel.currentTurnJid !== userJid) {
      await sock.sendMessage(groupId, {
        text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nIt is not your turn! Current turn: ${currentTurnTag}`,
        mentions: [duel.currentTurnJid]
      });
      return;
    }

    const attacker = userJid === duel.challengerJid ? duel.playerA : duel.playerB;
    const defender = userJid === duel.challengerJid ? duel.playerB : duel.playerA;

    let selectedMove: CardMove | null = null;
    let cardLevel = 1;

    for (const cardObj of attacker.offenseCards) {
      const foundMove = cardObj.character.moves.find((m) => m.move_id.toLowerCase() === moveId.toLowerCase());
      if (foundMove) {
        selectedMove = foundMove;
        cardLevel = cardObj.level;
        break;
      }
    }

    if (!selectedMove) {
      await sock.sendMessage(groupId, {
        text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩\n\nMove "${moveId}" is not available in your active Offense cards!`
      });
      return;
    }

    const bxpCost = selectedMove.bxp_cost || 3;
    if (attacker.bxp < bxpCost) {
      await sock.sendMessage(groupId, {
        text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ⬩ Insufficient Battle XP! Move requires ${bxpCost} BXP, but you only have ${attacker.bxp} BXP.`
      });
      return;
    }

    if (duel.turnTimer) clearTimeout(duel.turnTimer);

    attacker.bxp -= bxpCost;
    attacker.strikes = 0;

    const rawDamage = cardLoader.calculateScaledPoints(selectedMove.base_points, cardLevel);
    let remainingDamage = rawDamage;

    if (defender.shield > 0) {
      if (defender.shield >= remainingDamage) {
        defender.shield -= remainingDamage;
        remainingDamage = 0;
      } else {
        remainingDamage -= defender.shield;
        defender.shield = 0;
      }
    }

    if (remainingDamage > 0) {
      defender.hp -= remainingDamage;
    }

    const attackerTag = `@${attacker.jid.split('@')[0]}`;

    if (defender.hp <= 0) {
      defender.hp = 0;
      await sock.sendMessage(groupId, {
        text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｏ⬩\n\n${attackerTag} USED ${selectedMove.name} FOR ${rawDamage} DAMAGE AND LANDED A ONE-SHOT FINISHER!\n\n🏆 WINNER: ${attackerTag}!`,
        mentions: [attacker.jid, defender.jid]
      });
      await addDuelWinAndCheckRank(attacker.jid, groupId, sock);
      this.clearDuelTimers(duel);
      this.activeDuels.delete(duel.duelId);
      return;
    }

    duel.currentTurnJid = defender.jid;
    this.startTurnTimer(duel.duelId, sock);

    await this.broadcastCombatState(
      duel.duelId,
      sock,
      `${attackerTag} used *${selectedMove.name}* dealing ${rawDamage} DMG!`
    );
  }

  private async handleMatchTimeExpired(duelId: string, sock: WASocket): Promise<void> {
    const duel = this.activeDuels.get(duelId);
    if (!duel || duel.phase !== 'COMBAT') return;

    this.clearDuelTimers(duel);

    const scoreA = duel.playerA.hp + duel.playerA.shield;
    const scoreB = duel.playerB.hp + duel.playerB.shield;

    const tagA = `@${duel.playerA.jid.split('@')[0]}`;
    const tagB = `@${duel.playerB.jid.split('@')[0]}`;

    let winnerJid = '';
    let announcement = '';

    if (scoreA > scoreB) {
      winnerJid = duel.playerA.jid;
      announcement = `3-MINUTE MATCH TIMER EXPIRED!\n\n🏆 WINNER BY HIGHEST COMBINED STATS: ${tagA} (${scoreA} vs ${scoreB})`;
    } else if (scoreB > scoreA) {
      winnerJid = duel.playerB.jid;
      announcement = `3-MINUTE MATCH TIMER EXPIRED!\n\n🏆 WINNER BY HIGHEST COMBINED STATS: ${tagB} (${scoreB} vs ${scoreA})`;
    } else {
      announcement = `3-MINUTE MATCH TIMER EXPIRED!\n\n IT IS A DRAW! Both players ended with identical stats (${scoreA}).`;
    }

    await sock.sendMessage(duel.groupId, {
      text: `⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｔ Ｉ Ｍ Ｅ⬩\n\n${announcement}`,
      mentions: [duel.playerA.jid, duel.playerB.jid]
    });

    if (winnerJid) {
      await addDuelWinAndCheckRank(winnerJid, duel.groupId, sock);
    }

    this.activeDuels.delete(duelId);
  }

  private async broadcastCombatState(duelId: string, sock: WASocket, actionText: string): Promise<void> {
    const duel = this.activeDuels.get(duelId);
    if (!duel) return;

    const tagA = `@${duel.playerA.jid.split('@')[0]}`;
    const tagB = `@${duel.playerB.jid.split('@')[0]}`;
    const tagCurrent = `@${duel.currentTurnJid.split('@')[0]}`;

    const display =
`⬩Ｍ Ｕ Ｇ Ｅ Ｎ     Ｋ Ｉ Ｋ Ａ Ｉ⬩
${actionText}

🔴 ${tagA} (${duel.playerA.pushName})
  ├─ HP: ${duel.playerA.hp}/100
  ├─ SHIELD: ${duel.playerA.shield}
  └─ BXP: ⚡ ${duel.playerA.bxp}/10

🔵 ${tagB} (${duel.playerB.pushName})
  ├─ HP: ${duel.playerB.hp}/100
  ├─ SHIELD: ${duel.playerB.shield}
  └─ BXP: ⚡ ${duel.playerB.bxp}/10

👉 CURRENT TURN: ${tagCurrent} (30s)`;

await sock.sendMessage(duel.groupId, {
      text: display,
      mentions: [duel.playerA.jid, duel.playerB.jid, duel.currentTurnJid]
    });
  }

  private clearDuelTimers(duel: ActiveDuel): void {
    if (duel.phaseTimer) clearTimeout(duel.phaseTimer);
    if (duel.turnTimer) clearTimeout(duel.turnTimer);
    if (duel.matchTimer) clearTimeout(duel.matchTimer);
    if (duel.bxpInterval) clearInterval(duel.bxpInterval);
  }
}

export const duelManager = new DuelManager();
