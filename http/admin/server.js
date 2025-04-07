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
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Отдача админской страницы
    if (req.method === 'GET' && parsedUrl.pathname === '/admin.html') {
      const html = await fs.readFile(path.join(__dirname, 'admin.html'), 'utf8');
      res.writeHead(200, {'Content-Type': 'text/html'});
      return res.end(html);
    }

    // REST API для товаров
    if (pathSegments[0] === 'api' && pathSegments[1] === 'products') {
      const productId = pathSegments[2] ? parseInt(pathSegments[2]) : null;
      let products = JSON.parse(await fs.readFile(PRODUCTS_PATH, 'utf8'));

      // GET все товары
      if (req.method === 'GET' && !productId) {
        res.writeHead(200, {'Content-Type': 'application/json'});
        return res.end(JSON.stringify(products));
      }

      // Добавление товара
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          const newProduct = JSON.parse(body);
          newProduct.id = Math.max(...products.map(p => p.id)) + 1;
          products.push(newProduct);
          await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
          res.writeHead(201, {'Content-Type': 'application/json'});
          res.end(JSON.stringify(newProduct));
        });
        wsBroadcast(); // Отправка сигнала об обновлении
        return;
      }

      // Удаление товара
      if (req.method === 'DELETE' && productId) {
        const index = products.findIndex(p => p.id === productId);
        if (index === -1) {
          res.writeHead(404);
          return res.end('Not Found');
        }
        const [deleted] = products.splice(index, 1);
        await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
        res.writeHead(200);
        wsBroadcast(); // Отправка сигнала об обновлении
        return res.end(JSON.stringify(deleted));
      }

      // Редактирование товара
      if (req.method === 'PUT' && productId) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          const index = products.findIndex(p => p.id === productId);
          if (index === -1) {
            res.writeHead(404);
            return res.end('Not Found');
          }
          products[index] = {...products[index], ...JSON.parse(body)};
          await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
          res.writeHead(200);
          res.end(JSON.stringify(products[index]));
        });
        wsBroadcast(); // Отправка сигнала об обновлении
        return;
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
  console.log(`Admin server running at http://localhost:${PORT}`);
});