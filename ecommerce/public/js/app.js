// ===== ROUTER =====
function navigate(page, param = null) {
  document.getElementById('user-dropdown')?.classList.add('hidden');
  State.currentPage = page;
  State.currentParam = param;
  renderPage(page, param);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleSearch() {
  const val = document.getElementById('search-input').value.trim();
  State.filters.search = val;
  State.filters.page = 1;
  navigate('shop');
}

document.getElementById('search-input').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleSearch();
});

// ===== PAGE ROUTER =====
function renderPage(page, param) {
  const app = document.getElementById('app');
  switch (page) {
    case 'home':    renderHome(app); break;
    case 'shop':    renderShop(app); break;
    case 'product': renderProduct(app, param); break;
    case 'cart':    renderCart(app); break;
    case 'checkout':renderCheckout(app); break;
    case 'orders':  renderOrders(app); break;
    case 'order':   renderOrderDetail(app, param); break;
    case 'login':   renderLogin(app); break;
    case 'register':renderRegister(app); break;
    case 'success': renderSuccess(app, param); break;
    default:        renderHome(app);
  }
}

// ===== HOME PAGE =====
async function renderHome(app) {
  app.innerHTML = `
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">✨ New Arrivals Available</div>
        <h1>Shop the things you <span>actually love</span></h1>
        <p>Curated electronics, fashion, books, and lifestyle products — all in one place.</p>
        <div class="hero-actions">
          <button class="btn-hero-primary" onclick="navigate('shop')">Browse All Products</button>
          <button class="btn-hero-secondary" onclick="navigate('shop')">View Deals</button>
        </div>
      </div>
    </section>

    <div style="max-width:1280px;margin:0 auto;padding:0 24px">
      <h2 style="font-size:1.2rem;font-weight:700;margin:40px 0 20px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">Shop by Category</h2>
    </div>
    <div class="category-grid" id="cat-grid">${LoadingSpinner()}</div>

    <div class="section-header">
      <h2>Featured Products</h2>
      <a href="#" onclick="navigate('shop')">View all →</a>
    </div>
    <div class="home-product-grid" id="featured-grid">${LoadingSpinner()}</div>
  `;

  const catIcons = { electronics: '💻', clothing: '👕', books: '📚', 'home-garden': '🌱', sports: '🏃' };

  try {
    const [cats, { products }] = await Promise.all([
      API.get('/products/categories'),
      API.get('/products?limit=8&sort=popular'),
    ]);

    document.getElementById('cat-grid').innerHTML = cats.map(c => `
      <div class="category-card" onclick="State.filters.category='${c.slug}';State.filters.page=1;navigate('shop')">
        <div class="cat-icon">${catIcons[c.slug] || '🛍️'}</div>
        <div class="cat-name">${c.name}</div>
      </div>
    `).join('');

    document.getElementById('featured-grid').innerHTML = products.map(ProductCard).join('');
  } catch (err) {
    document.getElementById('featured-grid').innerHTML = `<p class="text-muted">${err.message}</p>`;
  }
}

// ===== SHOP PAGE =====
async function renderShop(app) {
  app.innerHTML = `<div class="page"><div class="shop-layout"><aside id="sidebar">${LoadingSpinner()}</aside><div class="products-main" id="products-main">${LoadingSpinner()}</div></div></div>`;
  await loadSidebar();
  await loadProducts();
}

async function loadSidebar() {
  const cats = await API.get('/products/categories');
  document.getElementById('sidebar').innerHTML = `
    <div class="filter-sidebar">
      <h3>Filters</h3>
      <div class="filter-group">
        <label>Category</label>
        <div class="filter-option"><input type="radio" name="cat" value="all" ${State.filters.category === 'all' ? 'checked' : ''} onchange="State.filters.category='all';State.filters.page=1;loadProducts()"> All Categories</div>
        ${cats.map(c => `<div class="filter-option"><input type="radio" name="cat" value="${c.slug}" ${State.filters.category === c.slug ? 'checked' : ''} onchange="State.filters.category='${c.slug}';State.filters.page=1;loadProducts()"> ${c.name}</div>`).join('')}
      </div>
      <div class="filter-group">
        <label>Price Range</label>
        <div class="price-range">
          <input type="number" placeholder="Min" value="${State.filters.minPrice}" id="minP" />
          <input type="number" placeholder="Max" value="${State.filters.maxPrice}" id="maxP" />
        </div>
        <button class="filter-apply" onclick="State.filters.minPrice=document.getElementById('minP').value;State.filters.maxPrice=document.getElementById('maxP').value;State.filters.page=1;loadProducts()">Apply</button>
      </div>
      <div class="filter-group">
        <label>Sort By</label>
        ${[['popular','Most Popular'],['rating','Top Rated'],['price-asc','Price: Low → High'],['price-desc','Price: High → Low'],['newest','Newest']].map(([v, l]) =>
          `<div class="filter-option"><input type="radio" name="sort" value="${v}" ${State.filters.sort===v?'checked':''} onchange="State.filters.sort='${v}';State.filters.page=1;loadProducts()"> ${l}</div>`
        ).join('')}
      </div>
    </div>
  `;
}

async function loadProducts() {
  const main = document.getElementById('products-main');
  if (!main) return;
  main.innerHTML = LoadingSpinner();

  const { filters } = State;
  const params = new URLSearchParams({
    ...(filters.category !== 'all' && { category: filters.category }),
    ...(filters.search && { search: filters.search }),
    ...(filters.sort && { sort: filters.sort }),
    ...(filters.minPrice && { minPrice: filters.minPrice }),
    ...(filters.maxPrice && { maxPrice: filters.maxPrice }),
    page: filters.page,
    limit: 12,
  });

  try {
    const { products, total, totalPages, page } = await API.get(`/products?${params}`);
    main.innerHTML = `
      <div class="shop-toolbar">
        <span class="results-count">${total} product${total !== 1 ? 's' : ''} found</span>
        <select class="sort-select" onchange="State.filters.sort=this.value;State.filters.page=1;loadProducts()">
          <option value="">Sort By</option>
          <option value="popular" ${filters.sort==='popular'?'selected':''}>Most Popular</option>
          <option value="rating" ${filters.sort==='rating'?'selected':''}>Top Rated</option>
          <option value="price-asc" ${filters.sort==='price-asc'?'selected':''}>Price: Low → High</option>
          <option value="price-desc" ${filters.sort==='price-desc'?'selected':''}>Price: High → Low</option>
          <option value="newest" ${filters.sort==='newest'?'selected':''}>Newest</option>
        </select>
      </div>
      ${products.length === 0
        ? '<div class="empty-state"><div class="empty-icon">🔍</div><h3>No products found</h3><p>Try different search terms or filters.</p></div>'
        : `<div class="product-grid">${products.map(ProductCard).join('')}</div>`
      }
      ${totalPages > 1 ? renderPagination(page, totalPages) : ''}
    `;
  } catch (err) {
    main.innerHTML = `<p class="text-muted text-center mt-24">${err.message}</p>`;
  }
}

function renderPagination(current, total) {
  let html = '<div class="pagination">';
  html += `<button class="page-btn" onclick="changePage(${current - 1})" ${current <= 1 ? 'disabled' : ''}>←</button>`;
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || Math.abs(i - current) <= 2) {
      html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
    } else if (Math.abs(i - current) === 3) {
      html += `<span style="padding:8px">…</span>`;
    }
  }
  html += `<button class="page-btn" onclick="changePage(${current + 1})" ${current >= total ? 'disabled' : ''}>→</button>`;
  return html + '</div>';
}

function changePage(p) { State.filters.page = p; loadProducts(); window.scrollTo({ top: 60, behavior: 'smooth' }); }

// ===== PRODUCT DETAIL =====
async function renderProduct(app, id) {
  app.innerHTML = `<div class="page">${LoadingSpinner()}</div>`;
  try {
    const { product, related } = await API.get(`/products/${id}`);
    let qty = 1;

    const stockBadge = product.stock === 0 ? '<span class="stock-badge stock-out">Out of Stock</span>'
      : product.stock <= 5 ? `<span class="stock-badge stock-low">Only ${product.stock} left</span>`
      : '<span class="stock-badge stock-in">In Stock</span>';

    app.innerHTML = `
      <div class="page">
        <div style="margin-bottom:16px;font-size:.875rem;color:var(--muted)">
          <a href="#" onclick="navigate('home')" style="color:var(--accent)">Home</a> /
          <a href="#" onclick="navigate('shop')" style="color:var(--accent)">Shop</a> /
          ${product.name}
        </div>
        <div class="product-detail">
          <div class="product-detail-image">
            <img src="${product.image_url}" alt="${product.name}" />
          </div>
          <div>
            <div class="detail-category">${product.category_name}</div>
            <h1 class="detail-title">${product.name}</h1>
            <div class="detail-rating">
              ${renderStars(product.rating)}
              <span class="text-muted" style="font-size:.875rem">${product.rating} (${product.review_count.toLocaleString()} reviews)</span>
            </div>
            <div class="detail-price">₹${Number(product.price).toFixed(2)}</div>
            ${stockBadge}
            <p class="detail-desc">${product.description}</p>
            ${product.stock > 0 ? `
              <div class="qty-control">
                <button class="qty-btn" onclick="adjustQty(-1)">−</button>
                <div class="qty-display" id="qty-val">1</div>
                <button class="qty-btn" onclick="adjustQty(1)">+</button>
              </div>
              <button class="btn-add-large" onclick="addToCartDetail(${product.id}, ${product.stock})">
                Add to Cart
              </button>
            ` : '<button class="btn-add-large" disabled>Out of Stock</button>'}
          </div>
        </div>
        ${related.length > 0 ? `
          <div class="related-section">
            <h2>You may also like</h2>
            <div class="product-grid">${related.map(ProductCard).join('')}</div>
          </div>
        ` : ''}
      </div>
    `;

    window.__detailQty = 1;
    window.__detailMaxQty = product.stock;
  } catch (err) {
    app.innerHTML = `<div class="page text-center mt-24 text-muted">${err.message}</div>`;
  }
}

function adjustQty(delta) {
  const el = document.getElementById('qty-val');
  if (!el) return;
  window.__detailQty = Math.max(1, Math.min(window.__detailMaxQty, (window.__detailQty || 1) + delta));
  el.textContent = window.__detailQty;
}

async function addToCartDetail(productId, stock) {
  if (!State.user) { navigate('login'); showToast('Please sign in first', 'warning'); return; }
  try {
    await API.post('/cart/add', { product_id: productId, quantity: window.__detailQty || 1 });
    showToast('Added to cart!', 'success');
    refreshCartCount();
  } catch (err) { showToast(err.message, 'error'); }
}

// ===== CART PAGE =====
async function renderCart(app) {
  if (!State.user) { navigate('login'); return; }
  app.innerHTML = `<div class="page">${LoadingSpinner()}</div>`;
  try {
    const { items, total, count } = await API.get('/cart');
    if (items.length === 0) {
      app.innerHTML = `<div class="page"><div class="empty-state">
        <div class="empty-icon">🛒</div>
        <h3>Your cart is empty</h3>
        <p>Add some products to get started.</p>
        <a href="#" class="btn-outline" onclick="navigate('shop')">Start Shopping</a>
      </div></div>`;
      return;
    }

    app.innerHTML = `
      <div class="page">
        <h1 class="page-title">Shopping Cart</h1>
        <p class="page-subtitle">${count} item${count !== 1 ? 's' : ''} in your cart</p>
        <div class="cart-layout">
          <div>
            <div id="cart-items">${items.map(cartItemHTML).join('')}</div>
          </div>
          <div class="order-summary">
            <h3>Order Summary</h3>
            <div class="summary-row"><span>Subtotal</span><span>₹${total.toFixed(2)}</span></div>
            <div class="summary-row"><span>Shipping</span><span>Free</span></div>
            <div class="summary-row"><span>Tax (8%)</span><span>₹${(total * 0.08).toFixed(2)}</span></div>
            <div class="summary-row total"><span>Total</span><span>₹${(total * 1.08).toFixed(2)}</span></div>
            <button class="checkout-btn" onclick="navigate('checkout')">Proceed to Checkout →</button>
            <button class="btn-outline" style="width:100%;text-align:center;display:block;margin-top:10px" onclick="navigate('shop')">Continue Shopping</button>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    app.innerHTML = `<div class="page text-center text-muted mt-24">${err.message}</div>`;
  }
}

function cartItemHTML(item) {
  return `
    <div class="cart-item" id="cart-item-${item.id}">
      <img class="cart-item-img" src="${item.image_url}" alt="${item.name}" onclick="navigate('product', ${item.product_id})" style="cursor:pointer" />
      <div class="cart-item-details">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">₹${Number(item.price).toFixed(2)} each</div>
        <div class="cart-item-actions">
          <div class="qty-mini">
            <button onclick="updateCartItem(${item.id}, ${item.quantity - 1})">−</button>
            <span>${item.quantity}</span>
            <button onclick="updateCartItem(${item.id}, ${item.quantity + 1})">+</button>
          </div>
          <button class="remove-btn" onclick="removeCartItem(${item.id})">Remove</button>
        </div>
      </div>
      <div class="cart-item-total">₹${(item.price * item.quantity).toFixed(2)}</div>
    </div>
  `;
}

async function updateCartItem(id, qty) {
  try {
    if (qty < 1) { await removeCartItem(id); return; }
    await API.put(`/cart/update/${id}`, { quantity: qty });
    renderCart(document.getElementById('app'));
    refreshCartCount();
  } catch (err) { showToast(err.message, 'error'); }
}

async function removeCartItem(id) {
  try {
    await API.delete(`/cart/remove/${id}`);
    renderCart(document.getElementById('app'));
    refreshCartCount();
    showToast('Item removed', 'default');
  } catch (err) { showToast(err.message, 'error'); }
}

// ===== CHECKOUT PAGE =====
async function renderCheckout(app) {
  if (!State.user) { navigate('login'); return; }
  let cartData;
  try { cartData = await API.get('/cart'); } catch { navigate('cart'); return; }
  if (!cartData.items.length) { navigate('cart'); return; }

  const { items, total } = cartData;
  const tax = total * 0.08;
  const grand = total + tax;

  app.innerHTML = `
    <div class="page">
      <h1 class="page-title">Checkout</h1>
      <div class="checkout-grid">
        <div>
          <div class="form-card" style="margin-bottom:20px">
            <h3>📦 Shipping Information</h3>
            <div class="form-row">
              <div class="form-group">
                <label>Full Name</label>
                <input class="form-control" id="s-name" value="${State.user.name}" placeholder="John Doe" />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input class="form-control" id="s-email" value="${State.user.email}" type="email" />
              </div>
            </div>
            <div class="form-group">
              <label>Street Address</label>
              <input class="form-control" id="s-addr" placeholder="123 Main Street" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>City</label>
                <input class="form-control" id="s-city" placeholder="Mumbai" />
              </div>
              <div class="form-group">
                <label>ZIP / Postal Code</label>
                <input class="form-control" id="s-zip" placeholder="400001" />
              </div>
            </div>
          </div>
          <div class="form-card">
            <h3>💳 Payment Method</h3>
            <div class="payment-option selected" onclick="selectPayment(this, 'card')">
              <input type="radio" name="pm" value="card" checked /> 💳 Credit / Debit Card
            </div>
            <div class="payment-option" onclick="selectPayment(this, 'upi')">
              <input type="radio" name="pm" value="upi" /> 📱 UPI
            </div>
            <div class="payment-option" onclick="selectPayment(this, 'cod')">
              <input type="radio" name="pm" value="cod" /> 💵 Cash on Delivery
            </div>
            <p style="font-size:.8rem;color:var(--muted);margin-top:16px">🔒 This is a demo. No real payment is processed.</p>
          </div>
        </div>
        <div class="order-summary">
          <h3>Order Summary</h3>
          ${items.map(i => `
            <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:.875rem">
              <span style="color:var(--slate)">${i.name} × ${i.quantity}</span>
              <span>₹${(i.price * i.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
          <div class="summary-row" style="margin-top:12px"><span>Subtotal</span><span>₹${total.toFixed(2)}</span></div>
          <div class="summary-row"><span>Shipping</span><span>Free</span></div>
          <div class="summary-row"><span>Tax (8%)</span><span>₹${tax.toFixed(2)}</span></div>
          <div class="summary-row total"><span>Grand Total</span><span>₹${grand.toFixed(2)}</span></div>
          <button class="submit-order-btn" onclick="placeOrder()">✓ Place Order</button>
        </div>
      </div>
    </div>
  `;
}

function selectPayment(el, val) {
  document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  el.querySelector('input').checked = true;
  window.__paymentMethod = val;
}
window.__paymentMethod = 'card';

async function placeOrder() {
  const body = {
    shipping_name: document.getElementById('s-name').value,
    shipping_email: document.getElementById('s-email').value,
    shipping_address: document.getElementById('s-addr').value,
    shipping_city: document.getElementById('s-city').value,
    shipping_zip: document.getElementById('s-zip').value,
    payment_method: window.__paymentMethod || 'card',
  };

  if (!body.shipping_name || !body.shipping_address || !body.shipping_city || !body.shipping_zip) {
    showToast('Please fill in all shipping fields', 'error'); return;
  }

  try {
    const { orderId } = await API.post('/orders/place', body);
    refreshCartCount();
    navigate('success', orderId);
  } catch (err) { showToast(err.message, 'error'); }
}

// ===== SUCCESS PAGE =====
function renderSuccess(app, orderId) {
  app.innerHTML = `
    <div class="page-sm">
      <div class="success-page">
        <div class="success-icon">🎉</div>
        <h2>Order Placed Successfully!</h2>
        <p>Your order #${orderId} has been received and is being processed. You'll get a confirmation shortly.</p>
        <div style="display:flex;gap:16px;justify-content:center;flex-wrap:wrap">
          <button class="btn-outline" onclick="navigate('order', ${orderId})">View Order</button>
          <button class="btn-outline" onclick="navigate('shop')" style="background:var(--accent);color:white;border-color:var(--accent)">Continue Shopping</button>
        </div>
      </div>
    </div>
  `;
}

// ===== ORDERS LIST =====
async function renderOrders(app) {
  if (!State.user) { navigate('login'); return; }
  app.innerHTML = `<div class="page">${LoadingSpinner()}</div>`;
  try {
    const orders = await API.get('/orders/my-orders');
    if (orders.length === 0) {
      app.innerHTML = `<div class="page"><div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>No orders yet</h3>
        <p>Your orders will appear here.</p>
        <a href="#" class="btn-outline" onclick="navigate('shop')">Start Shopping</a>
      </div></div>`;
      return;
    }
    app.innerHTML = `
      <div class="page-md">
        <h1 class="page-title">My Orders</h1>
        <p class="page-subtitle">${orders.length} order${orders.length !== 1 ? 's' : ''}</p>
        ${orders.map(o => `
          <div class="order-card">
            <div class="order-header">
              <div>
                <div class="order-id">Order #${o.id}</div>
                <div style="font-size:.8rem;color:var(--muted)">${new Date(o.created_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' })}</div>
              </div>
              <span class="order-status status-${o.status}">${o.status}</span>
            </div>
            <div class="order-footer">
              <div>${o.item_count} item${o.item_count !== 1 ? 's' : ''}</div>
              <div style="font-weight:700">₹${Number(o.total).toFixed(2)}</div>
              <button class="view-order-btn" onclick="navigate('order', ${o.id})">View Details →</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    app.innerHTML = `<div class="page text-center text-muted mt-24">${err.message}</div>`;
  }
}

// ===== ORDER DETAIL =====
async function renderOrderDetail(app, id) {
  if (!State.user) { navigate('login'); return; }
  app.innerHTML = `<div class="page">${LoadingSpinner()}</div>`;
  try {
    const { order, items } = await API.get(`/orders/${id}`);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    app.innerHTML = `
      <div class="page-md">
        <div style="margin-bottom:24px">
          <button onclick="navigate('orders')" style="color:var(--accent);font-weight:500;font-size:.875rem">← Back to Orders</button>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
          <div>
            <h1 class="page-title" style="margin-bottom:4px">Order #${order.id}</h1>
            <div style="color:var(--muted);font-size:.875rem">${new Date(order.created_at).toLocaleString()}</div>
          </div>
          <span class="order-status status-${order.status}">${order.status}</span>
        </div>
        <div class="form-card" style="margin-bottom:20px">
          <h3>Items Ordered</h3>
          ${items.map(item => `
            <div style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--border)">
              <img src="${item.image_url}" alt="${item.name}" style="width:60px;height:60px;border-radius:8px;object-fit:cover" />
              <div style="flex:1">
                <div style="font-weight:600">${item.name}</div>
                <div style="color:var(--muted);font-size:.875rem">Qty: ${item.quantity} × ₹${Number(item.price).toFixed(2)}</div>
              </div>
              <div style="font-weight:700">₹${(item.price * item.quantity).toFixed(2)}</div>
            </div>
          `).join('')}
          <div class="summary-row" style="margin-top:16px"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
          <div class="summary-row"><span>Tax</span><span>₹${(subtotal * 0.08).toFixed(2)}</span></div>
          <div class="summary-row total"><span>Total</span><span>₹${Number(order.total).toFixed(2)}</span></div>
        </div>
        <div class="form-card">
          <h3>Shipping Details</h3>
          <p>${order.shipping_name}<br>${order.shipping_email}<br>${order.shipping_address}<br>${order.shipping_city} ${order.shipping_zip}</p>
          <p style="margin-top:12px;color:var(--muted);font-size:.875rem">Payment: ${order.payment_method?.toUpperCase()}</p>
        </div>
      </div>
    `;
  } catch (err) {
    app.innerHTML = `<div class="page text-center text-muted mt-24">${err.message}</div>`;
  }
}

// ===== LOGIN PAGE =====
function renderLogin(app) {
  app.innerHTML = `
    <div class="page-sm">
      <div class="auth-card">
        <h2>Welcome back</h2>
        <p class="subtitle">Sign in to your ShopWave account</p>
        <div id="login-error" style="color:var(--error);font-size:.875rem;margin-bottom:12px;display:none"></div>
        <div class="form-group">
          <label>Email</label>
          <input class="form-control" id="l-email" type="email" placeholder="you@example.com" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input class="form-control" id="l-pass" type="password" placeholder="••••••••" onkeydown="if(event.key==='Enter')loginSubmit()" />
        </div>
        <button class="btn-auth" onclick="loginSubmit()">Sign In</button>
        <div class="auth-switch">Don't have an account? <a onclick="navigate('register')">Register free</a></div>
      </div>
    </div>
  `;
}

async function loginSubmit() {
  const email = document.getElementById('l-email').value;
  const password = document.getElementById('l-pass').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';

  try {
    const { user, token } = await API.post('/auth/login', { email, password });
    API.setToken(token);
    State.setUser(user);
    renderAuthNav();
    refreshCartCount();
    showToast(`Welcome back, ${user.name}!`, 'success');
    navigate('home');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  }
}

// ===== REGISTER PAGE =====
function renderRegister(app) {
  app.innerHTML = `
    <div class="page-sm">
      <div class="auth-card">
        <h2>Create your account</h2>
        <p class="subtitle">Join ShopWave and start shopping</p>
        <div id="reg-error" style="color:var(--error);font-size:.875rem;margin-bottom:12px;display:none"></div>
        <div class="form-group">
          <label>Full Name</label>
          <input class="form-control" id="r-name" placeholder="John Doe" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input class="form-control" id="r-email" type="email" placeholder="you@example.com" />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input class="form-control" id="r-pass" type="password" placeholder="Min. 6 characters" onkeydown="if(event.key==='Enter')registerSubmit()" />
        </div>
        <button class="btn-auth" onclick="registerSubmit()">Create Account</button>
        <div class="auth-switch">Already have an account? <a onclick="navigate('login')">Sign in</a></div>
      </div>
    </div>
  `;
}

async function registerSubmit() {
  const name = document.getElementById('r-name').value;
  const email = document.getElementById('r-email').value;
  const password = document.getElementById('r-pass').value;
  const errEl = document.getElementById('reg-error');
  errEl.style.display = 'none';

  try {
    const { user, token } = await API.post('/auth/register', { name, email, password });
    API.setToken(token);
    State.setUser(user);
    renderAuthNav();
    refreshCartCount();
    showToast(`Welcome to ShopWave, ${user.name}!`, 'success');
    navigate('home');
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  }
}

// ===== LOGOUT =====
async function logout() {
  try { await API.post('/auth/logout'); } catch (_) {}
  API.clearToken();
  State.clearUser();
  renderAuthNav();
  refreshCartCount();
  showToast('Signed out', 'default');
  navigate('home');
}

// ===== INIT =====
function init() {
  renderAuthNav();
  refreshCartCount();
  navigate('home');
}

init();
