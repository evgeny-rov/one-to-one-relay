import { RawData } from 'ws';
import { validateUid } from './uuid';

export type CommandName = 'create' | 'connect';
export type Command = [CommandName, string];

export const formatAsCommand = (data: RawData) => data.toString().split(' ');

export const validateCommand = (data: string[]): data is Command => {
  const [commandType, params] = data;

  switch (commandType) {
    case 'create':
      return true;
    case 'connect':
      return validateUid(params);
    default:
      return false;
  }
};
