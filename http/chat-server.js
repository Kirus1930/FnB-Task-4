const { WebSocketServer } = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocketServer({ server, path: '/chat' });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const role = url.searchParams.get('role') || 'customer';
  ws.role = role;

  ws.on('message', (data) => {
    const message = JSON.parse(data);
    message.timestamp = new Date().toISOString();
    message.from = role;

    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        if (
          (client.role === 'admin' && message.from === 'customer') ||
          (client.role === 'customer' && message.from === 'admin')
        ) {
          client.send(JSON.stringify(message));
        }
      }
    });
  });
});

server.listen(8080, () => {
  console.log('Chat server running on ws://localhost:8080/chat');
});