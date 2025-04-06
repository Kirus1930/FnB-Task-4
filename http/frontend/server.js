// server.js (клиентская часть)
const http = require('http');
const { parse } = require('url');
const { readFile } = require('fs').promises;
const path = require('path');
const { buildSchema } = require('graphql');

const PORT = 3500;
const PRODUCTS_PATH = path.join(__dirname, '../data/products.json');

// GraphQL схема
const schema = buildSchema(`
  type Product {
    id: Int!
    name: String!
    price: Int!
    description: String
    categories: [String!]
  }

  type Query {
    products(fields: [String!]!): [Product]
  }
`);

// Resolver
const root = {
  products: async ({ fields }) => {
    const data = await readFile(PRODUCTS_PATH, 'utf8');
    const products = JSON.parse(data);
    return products.map(product => 
      Object.fromEntries(
        Object.entries(product).filter(([key]) => fields.includes(key))
      )
    );
  }
};

const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { pathname, query } = parse(req.url, true);

  // Обработка GraphQL
  if (pathname === '/graphql' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { query: gqlQuery } = JSON.parse(body);
        const { errors, data } = await graphql(schema, gqlQuery, root);
        
        if (errors) {
          res.writeHead(400);
          res.end(JSON.stringify({ errors }));
        } else {
          res.writeHead(200);
          res.end(JSON.stringify(data));
        }
      } catch (err) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } 
  // Главная страница
  else if (pathname === '/' && req.method === 'GET') {
    try {
      const html = await readFile(path.join(__dirname, 'index.html'), 'utf8');
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);
    } catch (err) {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  } 
  else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// GraphQL исполнитель
async function graphql(schema, query, rootValue) {
  const { parse, validate, execute } = require('graphql');
  const ast = parse(query);
  const validationErrors = validate(schema, ast);
  
  if (validationErrors.length > 0) {
    return { errors: validationErrors };
  }

  return execute({
    schema,
    document: ast,
    rootValue,
  });
}

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});