const WebSocket = require('ws');
const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const PORT = 2600;
const server = http.createServer();
const wss = new WebSocket.Server({ server });

const connections = {
  customers: new Set(),
  admins: new Set()
};

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const role = url.pathname === '/admin' ? 'admins' : 'customers';
  
  connections[role].add(ws);
  console.log(`New ${role.slice(0, -1)} connected`);

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    
    // Пересылка сообщений между ролями
    const targets = role === 'customers' ? connections.admins : connections.customers;
    
    targets.forEach(target => {
      if (target.readyState === WebSocket.OPEN) {
        target.send(JSON.stringify({
          from: role,
          text: data.text,
          timestamp: new Date().toISOString()
        }));
      }
    });
  });

  ws.on('close', () => {
    connections[role].delete(ws);
    console.log(`${role.slice(0, -1)} disconnected`);
  });
});

server.listen(PORT, () => {
  console.log(`Chat server running at ws://localhost:${PORT}`);
});