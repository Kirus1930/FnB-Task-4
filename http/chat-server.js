const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3501 });

wss.on('connection', (ws, req) => {
  const role = new URL(req.url, 'ws://localhost').searchParams.get('role');
  ws.role = role || 'customer';

  ws.on('message', (message) => {
    const msg = JSON.parse(message);
    msg.timestamp = Date.now();
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        // Админы получают все сообщения
        if (client.role === 'admin') {
          client.send(JSON.stringify(msg));
        }
        // Пользователи получают только ответы поддержки
        else if (msg.from === 'support') {
          client.send(JSON.stringify(msg));
        }
      }
    });
  });
});