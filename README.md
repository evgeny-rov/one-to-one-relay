# One To One Relay

**1t1 Relay** is a Node.js WebSocket Server that allows two clients to establish P2P-like anonymous communication sessions.

## Client-Server Commands

Once the connection is established, the following commands(sent as messages) can be used to set up the session:

| Command | Server Response | Description |
| :------ | :-------------- | :---------- |
| create  | created sessionId | The server responds with a "created" message and the session ID that will be used to connect to the session by the second participant. |
| connect sessionId | connected | The server sends "connected" message to both participants, after which all messages relayed directly from client to client. |

## Server Close Events

| Code | Message |
| :--- | :------ |
| 4001 | Connection timed out |
| 4002 | Received incorrect or unknown command |
| 4003 | Connection closed by peer |
| 4004 | Session not found |
| 4005 | Unable to create new session |

## Spin your own
  * Developing - Clone repo, install dependencies, run - `npm run dev`
  * Production - Clone repo, install dependencies, run - `npm run build && npm run start`
