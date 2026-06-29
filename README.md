🛒 ShopWave — E-Commerce Store
A full-stack e-commerce application built with Node.js + Express + SQLite (backend) and vanilla HTML/CSS/JS (frontend).

Features
Product Listings — Browse 14+ seeded products across 5 categories
Product Detail Page — Full product info, ratings, related products
Shopping Cart — Add, update quantities, remove items
User Auth — Register & login with JWT authentication
Order Processing — Full checkout with shipping info & payment selection
Order History — View past orders with full details
Search & Filter — Search by keyword, filter by category, price range, sort options
Responsive Design — Works on desktop and mobile
Tech Stack
Layer	Technology
Backend	Node.js, Express.js
Database	SQLite via better-sqlite3
Auth	JWT (jsonwebtoken) + bcryptjs
Frontend	HTML5, CSS3, Vanilla JavaScript
Fonts	Google Fonts (Inter + Playfair)
Setup & Run
1. Install dependencies
npm install
2. Start the server
npm start
# or for development with auto-reload:
npm run dev
3. Open in browser
http://localhost:3000
The SQLite database is created automatically at db/store.db with 14 seeded products on first run.

Project Structure
ecommerce/
├── server.js              # Express entry point
├── package.json
├── db/
│   └── database.js        # SQLite schema, init & seed
├── middleware/
│   └── auth.js            # JWT middleware
├── routes/
│   ├── auth.js            # Register, Login, Logout, Me
│   ├── products.js        # List, Filter, Search, Detail
│   ├── cart.js            # Add, Update, Remove, Clear
│   └── orders.js          # Place, List, Detail
└── public/
    ├── index.html         # SPA shell
    ├── css/
    │   └── style.css
    └── js/
        ├── api.js         # Fetch wrapper + State
        ├── components.js  # Toast, Cards, Cart count
        └── app.js         # Page router + all pages
API Endpoints
Auth
Method	Endpoint	Description
POST	/api/auth/register	Create account
POST	/api/auth/login	Sign in
POST	/api/auth/logout	Sign out
GET	/api/auth/me	Current user
Products
Method	Endpoint	Description
GET	/api/products	List (filter/sort/page)
GET	/api/products/categories	All categories
GET	/api/products/:id	Single product + related
Cart (auth required)
Method	Endpoint	Description
GET	/api/cart	Get cart
POST	/api/cart/add	Add item
PUT	/api/cart/update/:id	Update quantity
DELETE	/api/cart/remove/:id	Remove item
DELETE	/api/cart/clear	Clear cart
Orders (auth required)
Method	Endpoint	Description
POST	/api/orders/place	Place order
GET	/api/orders/my-orders	List orders
GET	/api/orders/:id	Order detail
Environment Variables
Create a .env file (optional):

PORT=3000
JWT_SECRET=your-secret-key-here
Notes
This is a demo app — no real payment processing
Passwords are hashed with bcrypt (salt rounds: 10)
JWT tokens expire after 7 days
Stock is decremented on order placement
