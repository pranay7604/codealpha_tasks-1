const express = require('express');
const { getDB } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get cart
router.get('/', authMiddleware, (req, res) => {
  const db = getDB();
  const items = db.prepare(`
    SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image_url, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
  `).all(req.user.id);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  res.json({ items, total: Math.round(total * 100) / 100, count: items.reduce((s, i) => s + i.quantity, 0) });
});

// Add to cart
router.post('/add', authMiddleware, (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  const db = getDB();

  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.stock < quantity) return res.status(400).json({ error: 'Insufficient stock' });

  const existing = db.prepare('SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?').get(req.user.id, product_id);

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > product.stock) return res.status(400).json({ error: 'Insufficient stock' });
    db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ?').run(newQty, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)').run(req.user.id, product_id, quantity);
  }

  res.json({ message: 'Added to cart' });
});

// Update quantity
router.put('/update/:id', authMiddleware, (req, res) => {
  const { quantity } = req.body;
  const db = getDB();

  if (quantity < 1) {
    db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    return res.json({ message: 'Item removed' });
  }

  const item = db.prepare('SELECT ci.*, p.stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ? AND ci.user_id = ?').get(req.params.id, req.user.id);
  if (!item) return res.status(404).json({ error: 'Cart item not found' });
  if (quantity > item.stock) return res.status(400).json({ error: 'Insufficient stock' });

  db.prepare('UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?').run(quantity, req.params.id, req.user.id);
  res.json({ message: 'Cart updated' });
});

// Remove item
router.delete('/remove/:id', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM cart_items WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ message: 'Item removed' });
});

// Clear cart
router.delete('/clear', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);
  res.json({ message: 'Cart cleared' });
});

module.exports = router;
