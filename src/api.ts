import { WebSocketServer, WebSocket, RawData } from 'ws';
import { uuid } from './uuid';
import { validateCommand, formatAsCommand } from './command';
import type { CommandName, Command } from './command';
import logger from './logger';

const waitingRoom = new Map<string, WebSocket>();
const wss = new WebSocketServer({ port: 8080 });

const cleanup = (id: string) => {
  waitingRoom.delete(id);
  logger.info(`Clean up called, removed session id - ${id} from waiting room`);
};

const handleClose = (reason: string, ...clients: [WebSocket, ...WebSocket[]]) => {
  clients.forEach((ws) => {
    ws.close(1000, reason);
    // @ts-ignore
    logger.info(`Client - ${ws._socket!.remoteAddress} - Closing connection, reason: ${reason}`);
  });
};

const commandResolvers: Record<CommandName, (ws: WebSocket, command: Command) => void> = {
  create: (ws) => {
    const id = uuid();
    waitingRoom.set(id, ws);
    ws.on('close', () => cleanup(id));
    ws.send(`created ${id}`);

    // @ts-ignore
    logger.info(`Client - ${ws._socket!.remoteAddress} - Assigned session id: ${id}`);
  },
  connect: (ws, command) => {
    const [, id] = command;
    const peer = waitingRoom.get(id);

    if (peer) {
      cleanup(id);
      const peers = [ws, peer];

      peers.forEach((p, idx, arr) => {
        const nextPeer = arr[(idx + 1) % arr.length];

        p.on('close', () => handleClose('Peer closed connection', nextPeer));
        p.on('message', (data) => nextPeer.send(data.toString()));
        p.send('connected');
      });

      logger.info(
        `Session with id ${id} established between clients: guest - ${
          // @ts-ignore
          ws._socket!.remoteAddress
          // @ts-ignore
        }, initiator - ${peer._socket.remoteAddress}`
      );
    } else {
      handleClose('Not found', ws);
    }
  },
};

const handleConnection = (ws: WebSocket) => {
  // @ts-ignore
  logger.info(`Client - ${ws._socket!.remoteAddress} - Connected`);
  const TIMEOUT_AFTER = 30000;
  const timerId = setTimeout(() => handleClose('Timed out', ws), TIMEOUT_AFTER);

  const handleMessage = (rawData: RawData) => {
    clearTimeout(timerId);

    const someCommand = formatAsCommand(rawData);

    if (validateCommand(someCommand)) {
      const [commandName] = someCommand;
      commandResolvers[commandName](ws, someCommand);
    } else {
      handleClose('Unknown or incorrect command', ws);
    }
  };

  ws.once('message', handleMessage);
};

wss.on('connection', handleConnection);

const HOUR_IN_MS = 1000 * 60 * 60;

logger.info('Logging started');

const logHourlyUpdate = () =>
  logger.info(
    `Hourly update - connected clients: ${wss.clients.size}, clients in waiting room: ${waitingRoom.size}`
  );

logHourlyUpdate();

setInterval(logHourlyUpdate, HOUR_IN_MS);
