import fs from 'fs';
import path from 'path';
import { CharacterJSON, RarityTier } from '../types/card';

export const RARITY_BASE_COSTS: Record<RarityTier, number> = {
  Common: 1500000,
  Rare: 2500000,
  Epic: 5000000,
  Legendary: 7000000
};

class CardLoader {
  private cards: Map<string, CharacterJSON> = new Map();

  constructor() {
    this.loadAllCards();
  }

  public loadAllCards(): void {
    const jsonDirPath = path.join(process.cwd(), 'chjson');
    if (!fs.existsSync(jsonDirPath)) {
      return;
    }

    const files = fs.readdirSync(jsonDirPath);
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const filePath = path.join(jsonDirPath, file);
          const rawData = fs.readFileSync(filePath, 'utf-8');
          const cardData: CharacterJSON = JSON.parse(rawData);
          if (cardData && cardData.character_id) {
            this.cards.set(cardData.character_id.toLowerCase(), cardData);
          }
        } catch (err) {
          
        }
      }
    }
  }

  public getCard(characterId: string): CharacterJSON | undefined {
    return this.cards.get(characterId.toLowerCase());
  }

  public getAllCards(): CharacterJSON[] {
    return Array.from(this.cards.values());
  }

  public calculateScaledPoints(basePoints: number, level: number): number {
    return Math.floor(basePoints * Math.pow(1.5, level - 1));
  }

  public calculateUpgradeCost(rarity: RarityTier, targetLevel: number): number {
    const baseCost = RARITY_BASE_COSTS[rarity] || 1500000;
    return baseCost * (targetLevel - 1);
  }

  public getCardImagePath(characterId: string, level: number): string {
    const sanitizedId = characterId.toLowerCase();
    const targetPath = path.join(process.cwd(), 'assets', 'cards', `${sanitizedId}_${level}.jpg`);
    if (fs.existsSync(targetPath)) {
      return targetPath;
    }
    const fallbackPath = path.join(process.cwd(), 'assets', 'cards', `${sanitizedId}_1.jpg`);
    if (fs.existsSync(fallbackPath)) {
      return fallbackPath;
    }
    return path.join(process.cwd(), 'assets', 'cards', 'default.jpg');
  }
}

export const cardLoader = new CardLoader();
