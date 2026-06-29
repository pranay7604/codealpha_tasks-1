// ===== API UTILITY =====
const API = {
  token: localStorage.getItem('token'),

  async request(method, path, body = null) {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    };
    if (this.token) opts.headers['Authorization'] = `Bearer ${this.token}`;
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`/api${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },

  get: (path) => API.request('GET', path),
  post: (path, body) => API.request('POST', path, body),
  put: (path, body) => API.request('PUT', path, body),
  delete: (path) => API.request('DELETE', path),

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  },

  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// ===== STATE =====
const State = {
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  cartCount: 0,
  currentPage: 'home',
  filters: { category: 'all', search: '', sort: '', minPrice: '', maxPrice: '', page: 1 },

  setUser(user) {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  },

  clearUser() {
    this.user = null;
    localStorage.removeItem('user');
  },
};
