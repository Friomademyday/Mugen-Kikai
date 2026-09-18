import { Treasury } from '../database/models/Treasury';

export async function processGambleTaxes(groupId: string, bet: number, isWin: boolean, multiplier: number = 2): Promise<number> {
  const govTreasury = await Treasury.getTreasury('GOVERNOR', groupId);
  const presTreasury = await Treasury.getTreasury('PRESIDENTIAL');

  if (isWin) {
    const totalPayout = bet * multiplier;
    const grossProfit = totalPayout - bet;
    if (grossProfit <= 0) return totalPayout;

    const presTax = Math.floor(grossProfit * 0.18);
    const govTax = Math.floor(grossProfit * 0.12);
    const userPayout = bet + (grossProfit - presTax - govTax);

    presTreasury.balance += presTax;
    govTreasury.balance += govTax;

    await presTreasury.save();
    await govTreasury.save();

    return userPayout;
  } else {
    const presLossCut = Math.floor(bet * 0.55);
    const govLossCut = bet - presLossCut;

    presTreasury.balance += presLossCut;
    govTreasury.balance += govLossCut;

    await presTreasury.save();
    await govTreasury.save();

    return 0;
  }
}

export async function processRobberyPenaltyToHOS(penaltyAmount: number): Promise<void> {
  if (penaltyAmount <= 0) return;
  const hosTreasury = await Treasury.getTreasury('HOS');
  hosTreasury.balance += penaltyAmount;
  await hosTreasury.save();
}
