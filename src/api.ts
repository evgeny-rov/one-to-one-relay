import { WebSocketServer, WebSocket, RawData } from 'ws';
import { uuid } from './uuid';
import { validateCommand, formatAsCommand } from './command';

import type { CommandName, Command } from './command';

const closeMessagesByCode = {
  4001: 'Connection timed out',
  4002: 'Received incorrect or unknown command',
  4003: 'Connection closed by peer',
  4004: 'Session not found',
  4005: 'Unable to create new session',
} as const;

const PORT = Number(process.env.PORT ?? 3000);

const waitingRoom = new Map<string, WebSocket>();
const wss = new WebSocketServer({ port: PORT });

const keepAlive = (ws: WebSocket) => {
  const PING_INTERVAL = 30000;
  const intervalId: NodeJS.Timer = setInterval(
    () => ws.ping('', false, (er) => er && clearInterval(intervalId)),
    PING_INTERVAL
  );
};

const getUnusedSessionId = (retries = 100): string | null => {
  if (retries <= 0) {
    return null;
  }

  const id = uuid();

  if (!waitingRoom.has(id)) {
    return id;
  }

  return getUnusedSessionId(retries - 1);
};

const clearSessionId = (id: string) => waitingRoom.delete(id);

const handleClose = (
  closeCode: keyof typeof closeMessagesByCode,
  ...clients: [WebSocket, ...WebSocket[]]
) => {
  clients.forEach((ws) => ws.close(closeCode, closeMessagesByCode[closeCode]));
};

const commandResolvers: Record<CommandName, (ws: WebSocket, command: Command) => void> = {
  create: (ws) => {
    const id = getUnusedSessionId();

    if (id) {
      waitingRoom.set(id, ws);
      ws.onclose = () => clearSessionId(id);
      ws.send(`created ${id}`);
      keepAlive(ws);
    } else {
      handleClose(4005, ws);
    }
  },
  connect: (ws, command) => {
    const [, id] = command;
    const peer = waitingRoom.get(id);

    if (peer) {
      clearSessionId(id);
      keepAlive(ws);
      const peers = [ws, peer];

      peers.forEach((p, idx, arr) => {
        const nextPeer = arr[(idx + 1) % arr.length];

        p.onclose = () => handleClose(4003, nextPeer);
        p.on('message', (data) => nextPeer.send(data.toString()));
        p.send('connected');
      });
    } else {
      handleClose(4004, ws);
    }
  },
};

const handleConnection = (ws: WebSocket) => {
  ws.once('message', (rawData) => {
    const someCommand = formatAsCommand(rawData);

    if (validateCommand(someCommand)) {
      const [commandName] = someCommand;
      commandResolvers[commandName](ws, someCommand);
    } else {
      handleClose(4002, ws);
    }
  });
};

wss.on('connection', handleConnection);
