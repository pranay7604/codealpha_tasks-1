// ===== TOAST =====
function showToast(msg, type = 'default', duration = 3000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

// ===== STARS =====
function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  let s = '★'.repeat(full);
  if (half) s += '½';
  s += '☆'.repeat(5 - Math.ceil(rating));
  return `<span class="stars">${s}</span>`;
}

// ===== PRODUCT CARD =====
function ProductCard(product) {
  const inStock = product.stock > 0;
  return `
    <div class="product-card" onclick="navigate('product', ${product.id})">
      <div class="product-image">
        <img src="${product.image_url}" alt="${product.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'" />
        ${!inStock ? '<span class="badge-out">Out of Stock</span>' : ''}
      </div>
      <div class="product-info">
        <div class="product-category">${product.category_name || ''}</div>
        <div class="product-name">${product.name}</div>
        <div class="product-rating">
          ${renderStars(product.rating || 0)}
          <span class="rating-count">(${(product.review_count || 0).toLocaleString()})</span>
        </div>
        <div class="product-footer">
          <span class="product-price">₹${Number(product.price).toFixed(2)}</span>
          <button class="add-to-cart-btn" ${!inStock ? 'disabled' : ''}
            onclick="event.stopPropagation(); quickAddToCart(${product.id})">
            ${inStock ? 'Add to Cart' : 'Sold Out'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ===== LOADING SPINNER =====
function LoadingSpinner() {
  return `<div class="loading"><div class="spinner"></div></div>`;
}

// ===== MODAL =====
function openModal(html) {
  document.getElementById('modal-content').innerHTML = html;
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

// ===== AUTH NAV =====
function renderAuthNav() {
  const nav = document.getElementById('auth-nav');
  if (State.user) {
    const initials = State.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    nav.innerHTML = `
      <div class="user-menu">
        <div class="user-avatar" onclick="toggleUserMenu()">${initials}</div>
        <div class="user-dropdown hidden" id="user-dropdown">
          <a href="#" onclick="navigate('orders')">📦 My Orders</a>
          <div class="divider"></div>
          <a href="#" onclick="logout()">🚪 Sign Out</a>
        </div>
      </div>
    `;
  } else {
    nav.innerHTML = `<button class="nav-btn btn-primary" onclick="navigate('login')">Sign In</button>`;
  }
}

function toggleUserMenu() {
  const dd = document.getElementById('user-dropdown');
  if (dd) dd.classList.toggle('hidden');
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-menu')) {
    document.getElementById('user-dropdown')?.classList.add('hidden');
  }
});

// ===== CART COUNT =====
async function refreshCartCount() {
  const el = document.getElementById('cart-count');
  if (!State.user) { el.classList.add('hidden'); return; }
  try {
    const { count } = await API.get('/cart');
    State.cartCount = count;
    el.textContent = count;
    el.classList.toggle('hidden', count === 0);
  } catch (_) { el.classList.add('hidden'); }
}

// ===== QUICK ADD TO CART =====
async function quickAddToCart(productId) {
  if (!State.user) { navigate('login'); showToast('Please sign in to add items to cart', 'warning'); return; }
  try {
    await API.post('/cart/add', { product_id: productId, quantity: 1 });
    showToast('Added to cart!', 'success');
    refreshCartCount();
  } catch (err) {
    showToast(err.message, 'error');
  }
}
