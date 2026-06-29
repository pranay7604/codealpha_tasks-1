const express = require('express');
const { getDB } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Place order
router.post('/place', authMiddleware, (req, res) => {
  const { shipping_name, shipping_email, shipping_address, shipping_city, shipping_zip, payment_method } = req.body;

  if (!shipping_name || !shipping_email || !shipping_address || !shipping_city || !shipping_zip) {
    return res.status(400).json({ error: 'All shipping fields are required' });
  }

  const db = getDB();
  const cartItems = db.prepare(`
    SELECT ci.quantity, p.id as product_id, p.name, p.price, p.stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ?
  `).all(req.user.id);

  if (cartItems.length === 0) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  // Check stock
  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
    }
  }

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const placeOrder = db.transaction(() => {
    // Create order
    const order = db.prepare(`
      INSERT INTO orders (user_id, total, shipping_name, shipping_email, shipping_address, shipping_city, shipping_zip, payment_method, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'processing')
    `).run(req.user.id, Math.round(total * 100) / 100, shipping_name, shipping_email, shipping_address, shipping_city, shipping_zip, payment_method || 'card');

    const orderId = order.lastInsertRowid;

    // Add order items & update stock
    const insertItem = db.prepare('INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)');
    const updateStock = db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?');

    for (const item of cartItems) {
      insertItem.run(orderId, item.product_id, item.quantity, item.price);
      updateStock.run(item.quantity, item.product_id);
    }

    // Clear cart
    db.prepare('DELETE FROM cart_items WHERE user_id = ?').run(req.user.id);

    return orderId;
  });

  const orderId = placeOrder();
  res.json({ message: 'Order placed successfully', orderId });
});

// Get user orders
router.get('/my-orders', authMiddleware, (req, res) => {
  const db = getDB();
  const orders = db.prepare(`
    SELECT o.*,
      GROUP_CONCAT(p.name, ', ') as item_names,
      COUNT(oi.id) as item_count
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE o.user_id = ?
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all(req.user.id);

  res.json(orders);
});

// Get single order
router.get('/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const items = db.prepare(`
    SELECT oi.*, p.name, p.image_url
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `).all(order.id);

  res.json({ order, items });
});

module.exports = router;
