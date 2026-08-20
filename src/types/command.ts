import { WASocket, proto } from '@whiskeysockets/baileys';

export interface CommandContext {
  sock: WASocket;
  msg: proto.IWebMessageInfo;
  from: string;
  sender: string;
  args: string[];
  command: string;
  text: string;
  isGroup: boolean;
}

export interface Command {
  name: string;
  category: string;
  aliases?: string[];
  description: string;
  execute: (ctx: CommandContext) => Promise<void>;
}
