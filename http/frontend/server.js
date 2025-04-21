const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { graphql, buildSchema } = require('graphql');

const PORT = 3500;
const PRODUCTS_PATH = path.join(__dirname, '../data/products.json');

const schema = buildSchema(`
  type Product {
    id: Int!
    name: String!
    price: Int!
    description: String
    categories: [String!]!
  }

  type Query {
    products(fields: [String!]!): [Product!]!
  }
`);

const root = {
  products: async ({ fields }) => {
    const data = await fs.readFile(PRODUCTS_PATH, 'utf8');
    return JSON.parse(data).map(product => 
      Object.fromEntries(fields.map(f => [f, product[f]]))
    );
  }
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === '/graphql' && req.method === 'POST') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }
      
      const { query, variables } = JSON.parse(body);
      const result = await graphql({
        schema,
        source: query,
        rootValue: root,
        variableValues: variables
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    } 
    else if (req.url === '/' && req.method === 'GET') {
      const html = await fs.readFile(path.join(__dirname, 'index.html'), 'utf8');
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);
    } 
    else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } catch (err) {
    res.writeHead(500);
    res.end(err.message);
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});