const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const path = require('path');
const ws = require('ws');

const PORT = 8330;
const PRODUCTS_PATH = path.join(__dirname, '../data/products.json');

// WebSocket Server
const wss = new ws.Server({ port: 3501 });

wss.on('connection', (socket) => {
  socket.on('message', (message) => {
    wss.clients.forEach(client => {
      if (client.readyState === ws.OPEN) {
        client.send(message.toString());
      }
    });
  });
});

const server = http.createServer(async (req, res) => {
  // ... существующий REST API код ...
});

server.listen(PORT, () => {
  console.log(`Admin server running at http://localhost:${PORT}`);
});