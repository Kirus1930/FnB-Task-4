const http = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs').promises;
const url = require('url');
const path = require('path');

const PORT = 8330;
const PRODUCTS_PATH = './data/products.json';

// Общий WebSocket Server для всех событий
const wss = new WebSocketServer({ port: 3501 });

function broadcast(type, data) {
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type, data }));
    }
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathSegments = parsedUrl.pathname.split('/').filter(s => s);
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Отдача статики
    if (req.method === 'GET') {
      if (parsedUrl.pathname === '/admin.html') {
        const html = await fs.readFile(path.join(__dirname, 'admin.html'), 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(html);
      }
      return;
    }

    // REST API для товаров
    if (pathSegments[0] === 'api' && pathSegments[1] === 'products') {
      const productId = pathSegments[2] ? parseInt(pathSegments[2]) : null;
      let products = JSON.parse(await fs.readFile(PRODUCTS_PATH, 'utf8'));

      // GET все товары
      if (req.method === 'GET' && !productId) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(products));
      }

      // Обработка тела запроса
      let body = await new Promise(resolve => {
        let data = '';
        req.on('data', chunk => data += chunk);
        req.on('end', () => resolve(data));
      });

      // POST
      if (req.method === 'POST') {
        const newProduct = JSON.parse(body);
        newProduct.id = Math.max(...products.map(p => p.id)) + 1;
        products.push(newProduct);
        await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
        broadcast('products-update', products);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify(newProduct));
      }

      // DELETE
      if (req.method === 'DELETE' && productId) {
        const index = products.findIndex(p => p.id === productId);
        if (index === -1) return res.end('Not Found');
        const [deleted] = products.splice(index, 1);
        await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
        broadcast('products-update', products);
        return res.end(JSON.stringify(deleted));
      }

      // PUT
      if (req.method === 'PUT' && productId) {
        const index = products.findIndex(p => p.id === productId);
        if (index === -1) return res.end('Not Found');
        products[index] = { ...products[index], ...JSON.parse(body) };
        await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
        broadcast('products-update', products);
        return res.end(JSON.stringify(products[index]));
      }
    }

    res.writeHead(404);
    res.end('Not Found');
  } catch (err) {
    res.writeHead(500);
    res.end('Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Обработка чата
wss.on('connection', ws => {
  ws.on('message', message => {
    const msg = JSON.parse(message);
    if (msg.type === 'chat') {
      broadcast('chat', { 
        from: 'Admin', 
        text: msg.text, 
        time: new Date().toLocaleTimeString() 
      });
    }
  });
});