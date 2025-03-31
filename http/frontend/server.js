const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { parse } = require('url');
const { graphql, buildSchema } = require('graphql');

const PORT = 3500;
const PRODUCTS_PATH = path.join(__dirname, '../data/products.json');

// GraphQL схема
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
  },
};

const server = http.createServer(async (req, res) => {
  const { pathname } = parse(req.url, true);

  // Отдача статики
  if (req.method === 'GET' && pathname === '/') {
    try {
      const html = await fs.readFile(path.join(__dirname, 'index.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (err) {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
    return;
  }

  // Обработка GraphQL
  if (req.method === 'POST' && pathname === '/graphql') {
    let body = '';
    req.on('data', chunk => body += chunk);
    
    req.on('end', async () => {
      try {
        const { query, variables } = JSON.parse(body);
        const result = await graphql({
          schema,
          source: query,
          rootValue: root,
          variableValues: variables
        });
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}`);
});