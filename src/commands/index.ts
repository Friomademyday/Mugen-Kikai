import fs from 'fs';
import path from 'path';
import { Command } from '../index';
import { utilityCommands } from './utility';
import { groupCommands } from './group';
import { economyCommands } from './economy';
import { gambleCommands } from './gamble';
import { leaderboardCommands } from './leaderboard';

export const commands = new Map<string, Command>();

const allCommands: Command[] = [
  ...utilityCommands,
  ...groupCommands,
  ...economyCommands,
  ...gambleCommands,
  ...leaderboardCommands
];

for (const cmd of allCommands) {
  commands.set(cmd.name.toLowerCase(), cmd);
  if (cmd.aliases) {
    for (const alias of cmd.aliases) {
      commands.set(alias.toLowerCase(), cmd);
    }
  }
}

/**
 * Utility function to safely get local asset buffers for messages with images (e.g. menu, leaderboard)
 */
export function getAssetBuffer(filename: string): Buffer | null {
  try {
    const assetPath = path.join(process.cwd(), 'assets', filename);
    if (fs.existsSync(assetPath)) {
      return fs.readFileSync(assetPath);
    }
  } catch (error) {
    console.error(`Failed to load asset ${filename}:`, error);
  }
  return null;
}
