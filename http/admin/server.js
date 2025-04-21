const http = require('http');
const { WebSocketServer } = require('ws');
const fs = require('fs').promises;
const url = require('url');
const path = require('path');

const PORT = 8330;
const PRODUCTS_PATH = './data/products.json';

// WebSocket
const wss = new WebSocketServer({ port: 3501 });
wss.on('connection', ws => {
    ws.on('message', data => {
        const msg = JSON.parse(data);
        if (msg.type === 'chat') {
            wss.clients.forEach(client => {
                if (client.readyState === 1) {
                    client.send(JSON.stringify({
                        type: 'chat',
                        data: {
                            from: 'Admin',
                            text: msg.text,
                            time: new Date().toLocaleTimeString()
                        }
                    }));
                }
            });
        }
    });
});

// HTTP Server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathSegments = parsedUrl.pathname.split('/').filter(s => s);

    try {
        // Статика
        if (req.method === 'GET' && parsedUrl.pathname === '/admin.html') {
            const content = await fs.readFile(path.join(__dirname, 'admin.html'), 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            return res.end(content);
        }

        // API
        if (pathSegments[0] === 'api' && pathSegments[1] === 'products') {
            let products = JSON.parse(await fs.readFile(PRODUCTS_PATH, 'utf8'));
            const productId = pathSegments[2] ? parseInt(pathSegments[2]) : null;

            // GET
            if (req.method === 'GET' && !productId) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify(products));
            }

            // Body parser
            const body = await new Promise(resolve => {
                let data = '';
                req.on('data', chunk => data += chunk);
                req.on('end', () => resolve(data));
            });

            // POST
            if (req.method === 'POST') {
                const newProduct = JSON.parse(body);
                newProduct.id = Math.max(...products.map(p => p.id), 0) + 1;
                products.push(newProduct);
                await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
                broadcastProducts(products);
                return respond(res, 201, newProduct);
            }

            // DELETE
            if (req.method === 'DELETE' && productId) {
                products = products.filter(p => p.id !== productId);
                await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
                broadcastProducts(products);
                return respond(res, 200, { success: true });
            }

            // PUT
            if (req.method === 'PUT' && productId) {
                const updated = JSON.parse(body);
                products = products.map(p => p.id === productId ? { ...p, ...updated } : p);
                await fs.writeFile(PRODUCTS_PATH, JSON.stringify(products, null, 2));
                broadcastProducts(products);
                return respond(res, 200, updated);
            }
        }

        respond(res, 404, { error: 'Not Found' });
    } catch (err) {
        respond(res, 500, { error: 'Server Error' });
    }
});

function broadcastProducts(products) {
    wss.clients.forEach(client => {
        if (client.readyState === 1) {
            client.send(JSON.stringify({ type: 'products-update', data: products }));
        }
    });
}

function respond(res, status, data) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));