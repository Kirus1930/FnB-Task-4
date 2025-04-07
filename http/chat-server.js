const { WebSocketServer } = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocketServer({ server, path: '/chat' });

const CHAT_PORT = 8080;

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    const message = JSON.parse(data);
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          user: message.user,
          text: message.text,
          timestamp: new Date().toISOString()
        }));
      }
    });
  });
});

server.listen(CHAT_PORT, () => {
  console.log(`Chat server running on port ${CHAT_PORT}`);
});