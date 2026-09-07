import { utilityCommands } from './utility';
import { Command } from '../index';

export const commands = new Map<string, Command>();

const allCommands: Command[] = [
  ...utilityCommands
];

for (const cmd of allCommands) {
  commands.set(cmd.name.toLowerCase(), cmd);
  if (cmd.aliases) {
    for (const alias of cmd.aliases) {
      commands.set(alias.toLowerCase(), cmd);
    }
  }
}
