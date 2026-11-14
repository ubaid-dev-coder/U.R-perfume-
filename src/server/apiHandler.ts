import fs from 'fs';
import path from 'path';
import type { IncomingMessage, ServerResponse } from 'http';
import {
  INITIAL_PRODUCTS,
  INITIAL_SETTINGS,
  INITIAL_STORES,
  INITIAL_STORE_PRODUCTS,
} from '../data/initialData';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseShape {
  products: any[];
  orders: any[];
  settings: any;
  stores: any[];
  storeProducts: any[];
}

function ensureDb(): DatabaseShape {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseShape = {
        products: INITIAL_PRODUCTS,
        orders: [],
        settings: INITIAL_SETTINGS,
        stores: INITIAL_STORES,
        storeProducts: INITIAL_STORE_PRODUCTS,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    let mutated = false;
    if (!Array.isArray(parsed.stores) || parsed.stores.length === 0) {
      parsed.stores = INITIAL_STORES;
      mutated = true;
    }
    if (!Array.isArray(parsed.storeProducts)) {
      parsed.storeProducts = INITIAL_STORE_PRODUCTS;
      mutated = true;
    }
    if (!Array.isArray(parsed.products)) {
      parsed.products = INITIAL_PRODUCTS;
      mutated = true;
    }
    if (!Array.isArray(parsed.orders)) {
      parsed.orders = [];
      mutated = true;
    }
    if (!parsed.settings) {
      parsed.settings = INITIAL_SETTINGS;
      mutated = true;
    }
    if (mutated) {
      fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    }
    return parsed;
  } catch (err) {
    console.error('Database initialization error:', err);
    return {
      products: INITIAL_PRODUCTS,
      orders: [],
      settings: INITIAL_SETTINGS,
      stores: INITIAL_STORES,
      storeProducts: INITIAL_STORE_PRODUCTS,
    };
  }
}

function saveDb(data: DatabaseShape) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Database save error:', err);
  }
}

function parseJsonBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // 25MB limit for base64 store logos & bottle photographs
      if (body.length > 25 * 1024 * 1024) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

export async function handleApiRequest(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void
) {
  const url = req.url || '';
  if (!url.startsWith('/api')) {
    return next();
  }

  const db = ensureDb();
  const method = req.method?.toUpperCase();

  try {
    // GET /api/products
    if (url === '/api/products' && method === 'GET') {
      return sendJson(res, 200, db.products);
    }

    // POST /api/products
    if (url === '/api/products' && method === 'POST') {
      const body = await parseJsonBody(req);
      if (Array.isArray(body)) {
        db.products = body;
        saveDb(db);
        return sendJson(res, 200, { success: true, count: db.products.length });
      }
      return sendJson(res, 400, { error: 'Expected array of products' });
    }

    // GET /api/stores
    if (url === '/api/stores' && method === 'GET') {
      return sendJson(res, 200, db.stores);
    }

    // POST /api/stores
    if (url === '/api/stores' && method === 'POST') {
      const body = await parseJsonBody(req);
      if (Array.isArray(body)) {
        db.stores = body;
        saveDb(db);
        return sendJson(res, 200, { success: true, count: db.stores.length });
      }
      return sendJson(res, 400, { error: 'Expected array of stores' });
    }

    // GET /api/store-products
    if (url === '/api/store-products' && method === 'GET') {
      return sendJson(res, 200, db.storeProducts);
    }

    // POST /api/store-products
    if (url === '/api/store-products' && method === 'POST') {
      const body = await parseJsonBody(req);
      if (Array.isArray(body)) {
        db.storeProducts = body;
        saveDb(db);
        return sendJson(res, 200, { success: true, count: db.storeProducts.length });
      }
      return sendJson(res, 400, { error: 'Expected array of storeProducts' });
    }

    // GET /api/orders
    if (url === '/api/orders' && method === 'GET') {
      return sendJson(res, 200, db.orders);
    }

    // POST /api/orders
    if (url === '/api/orders' && method === 'POST') {
      const newOrder = await parseJsonBody(req);
      db.orders.unshift(newOrder);
      saveDb(db);
      return sendJson(res, 201, { success: true, order: newOrder });
    }

    // PUT /api/orders/:id/status
    if (url.startsWith('/api/orders/') && url.endsWith('/status') && method === 'PUT') {
      const parts = url.split('/');
      const orderId = parts[3];
      const { status } = await parseJsonBody(req);
      const target = db.orders.find((o) => o.id === orderId);
      if (target) {
        target.status = status;
        saveDb(db);
        return sendJson(res, 200, { success: true, order: target });
      }
      return sendJson(res, 404, { error: 'Order not found' });
    }

    // GET /api/settings
    if (url === '/api/settings' && method === 'GET') {
      return sendJson(res, 200, db.settings);
    }

    // POST /api/settings
    if (url === '/api/settings' && method === 'POST') {
      const updated = await parseJsonBody(req);
      db.settings = { ...db.settings, ...updated };
      saveDb(db);
      return sendJson(res, 200, { success: true, settings: db.settings });
    }

    return sendJson(res, 404, { error: 'API endpoint not found' });
  } catch (error: any) {
    console.error('API Handler Error:', error);
    return sendJson(res, 500, { error: error?.message || 'Server error' });
  }
}
