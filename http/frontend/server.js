// server.js (клиентская часть, порт 3500)
const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const { parse } = require('url');
const { ApolloServer } = require('apollo-server');
const { makeExecutableSchema } = require('@graphql-tools/schema');

const PORT = 3500;
const PRODUCTS_PATH = path.join(__dirname, '../data/products.json');

// GraphQL Schema
const typeDefs = `
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
`;

const resolvers = {
  Query: {
    products: async (_, { fields }) => {
      const data = await fs.readFile(PRODUCTS_PATH, 'utf8');
      return JSON.parse(data).map(product => 
        Object.fromEntries(fields.map(f => [f, product[f]]))
      )
    }
  }
};

const schema = makeExecutableSchema({ typeDefs, resolvers });
const apolloServer = new ApolloServer({ schema });

// HTTP Server
const server = http.createServer(async (req, res) => {
  const { pathname } = parse(req.url, true);
  
  if (pathname === '/graphql' && req.method === 'POST') {
    apolloServer.createHandler()(req, res);
  } else if (pathname === '/' && req.method === 'GET') {
    try {
      const html = await fs.readFile(path.join(__dirname, 'index.html'), 'utf8');
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end(html);
    } catch (err) {
      res.writeHead(500);
      res.end('Internal Server Error');
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`Frontend server running at http://localhost:${PORT}`);
});