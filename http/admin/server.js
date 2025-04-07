const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const path = require('path');
const ws = require('ws');

const PORT = 8330;
const PRODUCTS_PATH = path.join(__dirname, '../data/products.json');

// WebSocket Server
const wss = new ws.Server({ port: 3500 });

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
  const parsedUrl = url.parse(req.url, true);
  const pathSegments = parsedUrl.pathname.split('/').filter(s => s);

  try {
    // Отдача статики
    if (req.method === 'GET' && parsedUrl.pathname === '/admin.html') {
      const html = await fs.readFile(path.join(__dirname, 'admin.html'), 'utf8');
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);
    }
    
    // Остальной REST API код из предыдущих заданий
    else if (pathSegments[0] === 'api' && pathSegments[1] === 'products') {
      // ... реализация CRUD операций ...
    }
    
    else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } catch (err) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Admin server running at http://localhost:${PORT}`);
});