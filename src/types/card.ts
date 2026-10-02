export type CharacterType = 'offense' | 'defense';
export type RarityTier = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface CardMove {
  move_id: string;
  name: string;
  base_points: number;
  bxp_cost?: number;
  description?: string;
}

export interface CharacterJSON {
  character_id: string;
  name: string;
  character_type: CharacterType;
  rarity: RarityTier;
  max_level: number;
  moves: CardMove[];
}

export interface UserInventoryItem {
  character_id: string;
  level: number;
}
