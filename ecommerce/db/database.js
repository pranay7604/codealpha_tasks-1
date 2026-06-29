const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'store.db');

let db;

function getDB() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'customer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      image_url TEXT,
      category_id INTEGER,
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      total REAL NOT NULL,
      shipping_name TEXT,
      shipping_email TEXT,
      shipping_address TEXT,
      shipping_city TEXT,
      shipping_zip TEXT,
      payment_method TEXT DEFAULT 'card',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
  `);

  // Seed categories and products if empty
  const count = db.prepare('SELECT COUNT(*) as c FROM products').get();
  if (count.c === 0) {
    seedData(db);
  }

  console.log('✅ Database initialized');
}

function seedData(db) {
  // Categories
  const categories = [
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Clothing', slug: 'clothing' },
    { name: 'Books', slug: 'books' },
    { name: 'Home & Garden', slug: 'home-garden' },
    { name: 'Sports', slug: 'sports' },
  ];

  const insertCat = db.prepare('INSERT INTO categories (name, slug) VALUES (?, ?)');
  categories.forEach(c => insertCat.run(c.name, c.slug));

  // Products
  const products = [
    // Electronics
    { name: 'Wireless Headphones Pro', description: 'Premium noise-cancelling wireless headphones with 30hr battery life, crystal-clear audio, and foldable design. Perfect for travel and work.', price: 89.99, stock: 45, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80', category_id: 1, rating: 4.7, review_count: 312 },
    { name: 'Mechanical Keyboard', description: 'TKL mechanical keyboard with RGB backlight and tactile switches. Durable aluminum frame, N-key rollover for gaming and productivity.', price: 129.99, stock: 30, image_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80', category_id: 1, rating: 4.5, review_count: 189 },
    { name: 'Smart Watch Series X', description: 'Track fitness, receive notifications, and monitor health metrics. 7-day battery, water-resistant, GPS, heart rate and SpO2 monitoring.', price: 249.99, stock: 22, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80', category_id: 1, rating: 4.8, review_count: 504 },
    { name: 'Portable Bluetooth Speaker', description: 'Waterproof 360° sound speaker with 20-hour battery. Built-in mic, USB-C charging, and connect two for stereo pairing.', price: 59.99, stock: 60, image_url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80', category_id: 1, rating: 4.4, review_count: 278 },
    { name: 'USB-C Hub 7-in-1', description: 'Expand your laptop with HDMI 4K, 3 USB-A, SD/microSD card slots and 100W PD charging. Compact aluminum build.', price: 44.99, stock: 80, image_url: 'https://images.unsplash.com/photo-1625895197185-efcec01cffe0?w=400&q=80', category_id: 1, rating: 4.3, review_count: 156 },
    // Clothing
    { name: 'Classic Denim Jacket', description: 'Timeless denim jacket in a relaxed fit. Made from 100% cotton denim with button-front closure and chest pockets. A wardrobe essential.', price: 79.99, stock: 35, image_url: 'https://images.unsplash.com/photo-1601933470096-0e34634ffcde?w=400&q=80', category_id: 2, rating: 4.6, review_count: 221 },
    { name: 'Premium Merino Sweater', description: 'Ultra-soft merino wool sweater with ribbed cuffs and hem. Temperature-regulating, odor-resistant, and machine washable.', price: 95.00, stock: 28, image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&q=80', category_id: 2, rating: 4.7, review_count: 143 },
    { name: 'Running Shoes Air Boost', description: 'Lightweight performance running shoes with responsive foam midsole. Breathable mesh upper and durable rubber outsole for all terrains.', price: 119.99, stock: 50, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80', category_id: 2, rating: 4.5, review_count: 387 },
    // Books
    { name: 'The Art of Clean Code', description: 'A practical guide to writing maintainable, scalable software. Covers design patterns, refactoring, testing, and professional best practices.', price: 34.99, stock: 100, image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&q=80', category_id: 3, rating: 4.9, review_count: 891 },
    { name: 'Deep Work', description: 'Rules for focused success in a distracted world. Learn how to cultivate deep focus and produce better work in less time.', price: 18.99, stock: 75, image_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80', category_id: 3, rating: 4.8, review_count: 1204 },
    // Home & Garden
    { name: 'Pour-Over Coffee Set', description: 'Complete pour-over brewing kit with borosilicate glass carafe, stainless steel filter, bamboo stand, and precision pour kettle.', price: 68.00, stock: 40, image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&q=80', category_id: 4, rating: 4.7, review_count: 326 },
    { name: 'Indoor Plant Grow Light', description: 'Full-spectrum LED grow light for indoor plants. 3 light modes, auto timer, adjustable gooseneck arm. Suitable for all growth stages.', price: 39.99, stock: 55, image_url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80', category_id: 4, rating: 4.4, review_count: 198 },
    // Sports
    { name: 'Yoga Mat Premium', description: 'Extra-thick 6mm non-slip yoga mat with alignment lines. Eco-friendly TPE material, includes carrying strap. 183cm × 61cm.', price: 49.99, stock: 65, image_url: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&q=80', category_id: 5, rating: 4.6, review_count: 433 },
    { name: 'Adjustable Dumbbell Set', description: 'Space-saving adjustable dumbbells from 5-52.5 lbs per hand. Quick-change mechanism, ergonomic handle, and included storage tray.', price: 299.99, stock: 15, image_url: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80', category_id: 5, rating: 4.8, review_count: 562 },
  ];

  const insertProduct = db.prepare(`
    INSERT INTO products (name, description, price, stock, image_url, category_id, rating, review_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((products) => {
    for (const p of products) {
      insertProduct.run(p.name, p.description, p.price, p.stock, p.image_url, p.category_id, p.rating, p.review_count);
    }
  });

  insertMany(products);
  console.log('✅ Seeded', products.length, 'products');
}

module.exports = { getDB, initDB };
