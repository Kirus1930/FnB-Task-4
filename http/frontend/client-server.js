// client-server.js
const http = require('http');
const { parse } = require('url');
const { buildSchema, graphql } = require('graphql');
const fs = require('fs').promises;
const path = require('path');
const ws = require('ws');

const PORT = 3500;
const PRODUCTS_PATH = path.join(__dirname, '../data/products.json');

// GraphQL Schema
const schema = buildSchema(`
  type Product {
    id: Int
    name: String
    price: Int
    description: String
    categories: [String]
  }

  type Query {
    products(fields: [String]!): [Product]
  }
`);

const root = {
  products: async ({ fields }) => {
    const data = await fs.readFile(PRODUCTS_PATH, 'utf8');
    const products = JSON.parse(data);
    return products.map(product => 
      fields.reduce((acc, field) => ({ ...acc, [field]: product[field] }), {})
    );
  }
};

const server = http.createServer(async (req, res) => {
  const { pathname, query } = parse(req.url, true);
  
  try {
    if (req.method === 'GET' && pathname === '/') {
      const html = await fs.readFile(path.join(__dirname, 'index.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    }
    else if (req.method === 'POST' && pathname === '/graphql') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', async () => {
        const { query } = JSON.parse(body);
        const result = await graphql(schema, query, root);
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        });
        res.end(JSON.stringify(result));
      });
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

server.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}`);
});