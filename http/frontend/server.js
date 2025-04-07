const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const PORT = 3500;
const PRODUCTS_PATH = path.join(__dirname, '../data/products.json');

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/' && req.method === 'GET') {
      const html = await fs.readFile(path.join(__dirname, 'index.html'), 'utf8');
      const productsData = await fs.readFile(PRODUCTS_PATH, 'utf8');
      const products = JSON.parse(productsData);
      
      const cards = products.map(product => `
        <div class="card" style="border:1px solid #ddd; padding:15px; margin:10px; border-radius:5px;">
          <h3>${product.name}</h3>
          <p>Цена: ${product.price} руб.</p>
          <p>${product.description}</p>
          <p>Категории: ${product.categories.join(', ')}</p>
        </div>
      `).join('');
      
      const response = html.replace('<!-- PRODUCTS -->', cards);
      
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(response);
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
  console.log(`Frontend server running at http://localhost:${PORT}`);
});