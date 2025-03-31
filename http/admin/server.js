const http = require('http');
const url = require('url');
const fs = require('fs').promises;
const path = require('path');

const PORT = 8330;
const PRODUCTS_PATH = path.join(__dirname, '../data/products.json');

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathSegments = parsedUrl.pathname.split('/').filter(s => s);

  try {
    let products = JSON.parse(await fs.readFile(PRODUCTS_PATH, 'utf8'));

    if (pathSegments[0] === 'api' && pathSegments[1] === 'products') {
      const productId = pathSegments[2] ? parseInt(pathSegments[2]) : null;

      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          const newProducts = JSON.parse(body);
          const maxId = products.reduce((max, p) => Math.max(max, p.id), 0);
          
          if (Array.isArray(newProducts)) {
            newProducts.forEach((p, i) => p.id = maxId + i + 1);
            products.push(...newProducts);
          } else {
            newProducts.id = maxId + 1;
            products.push(newProducts);
          }
          
          await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
          res.writeHead(201, {'Content-Type': 'application/json'});
          res.end(JSON.stringify(newProducts));
        });
      }
      else if (req.method === 'PUT' && productId) {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          const index = products.findIndex(p => p.id === productId);
          if (index === -1) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Product not found' }));
          } else {
            products[index] = { ...products[index], ...JSON.parse(body) };
            await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(products[index]));
          }
        });
      }
      else if (req.method === 'DELETE' && productId) {
        const index = products.findIndex(p => p.id === productId);
        if (index === -1) {
          res.writeHead(404);
          res.end(JSON.stringify({ error: 'Product not found' }));
        } else {
          const [deleted] = products.splice(index, 1);
          await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
          res.writeHead(200);
          res.end(JSON.stringify(deleted));
        }
      }
      else {
        res.writeHead(400);
        res.end('Invalid request');
      }
    } else {
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