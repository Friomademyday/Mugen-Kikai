import fs from 'fs';
import path from 'path';
import { Command } from '../types/command';
import { utilityCommands } from './utility';
import { groupCommands } from './group';
import { economyCommands } from './economy';
import { gambleCommands } from './gamble';
import { leaderboardCommands } from './leaderboard';
import { electionCommands } from './election';
import { politicsCommands } from './politics';

export const commands = new Map<string, Command>();

const allCommands: Command[] = [
  ...utilityCommands,
  ...groupCommands,
  ...economyCommands,
  ...gambleCommands,
  ...leaderboardCommands,
  ...electionCommands,
  ...politicsCommands
];

for (const cmd of allCommands) {
  commands.set(cmd.name.toLowerCase(), cmd);
  if (cmd.aliases) {
    for (const alias of cmd.aliases) {
      commands.set(alias.toLowerCase(), cmd);
    }
  }
}

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
