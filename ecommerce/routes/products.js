const express = require('express');
const { getDB } = require('../db/database');

const router = express.Router();

// Get all products with optional filtering
router.get('/', (req, res) => {
  const db = getDB();
  const { category, search, sort, minPrice, maxPrice, page = 1, limit = 12 } = req.query;

  let query = `
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (category && category !== 'all') {
    query += ' AND c.slug = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (p.name LIKE ? OR p.description LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  if (minPrice) { query += ' AND p.price >= ?'; params.push(Number(minPrice)); }
  if (maxPrice) { query += ' AND p.price <= ?'; params.push(Number(maxPrice)); }

  const sortMap = {
    'price-asc': 'p.price ASC',
    'price-desc': 'p.price DESC',
    'rating': 'p.rating DESC',
    'newest': 'p.created_at DESC',
    'popular': 'p.review_count DESC'
  };
  query += ` ORDER BY ${sortMap[sort] || 'p.id ASC'}`;

  const total = db.prepare(`SELECT COUNT(*) as count FROM (${query})`).get(...params).count;
  query += ` LIMIT ? OFFSET ?`;
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const products = db.prepare(query).all(...params);
  res.json({ products, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) });
});

// Get categories
router.get('/categories', (req, res) => {
  const db = getDB();
  const categories = db.prepare('SELECT * FROM categories').all();
  res.json(categories);
});

// Get single product
router.get('/:id', (req, res) => {
  const db = getDB();
  const product = db.prepare(`
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!product) return res.status(404).json({ error: 'Product not found' });

  // Related products
  const related = db.prepare(`
    SELECT p.*, c.name as category_name FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.category_id = ? AND p.id != ?
    LIMIT 4
  `).all(product.category_id, product.id);

  res.json({ product, related });
});

module.exports = router;
