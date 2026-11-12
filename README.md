# 🛒 E-Commerce Web Application

A full-stack e-commerce web application built with **React, Node.js, Express.js, PostgreSQL, JWT authentication, Docker, and GitHub Actions CI/CD**.

The project provides separate functionality for customers and administrators, including product management, shopping cart, checkout, order management, authentication, and an admin dashboard.

---

## 🚀 Features

### 👤 Authentication

- User registration
- User login
- JWT-based authentication
- Password hashing with bcrypt
- Get current authenticated user
- Logout
- Role-based authorization
- Customer and Admin roles

### 🛍️ Customer Features

- Browse products
- View product details
- Add products to cart
- Update cart quantity
- Remove products from cart
- Clear cart
- Checkout
- Create orders
- View personal orders
- View order details

### 👨‍💼 Admin Features

- Admin dashboard
- View statistics
- View recent orders
- Create products
- Update products
- Delete products
- Create categories
- Update categories
- Delete categories
- View all customer orders
- View individual orders
- Update order status

### 🔐 Security

- JWT authentication
- Password hashing using bcrypt
- Protected routes
- Admin-only routes
- Input validation (Zod) on every write endpoint
- Rate limiting on login and register
- CORS restricted to the frontend's domain
- Environment variables for sensitive configuration
- PostgreSQL constraints

### 🐳 DevOps

- Docker
- Docker-based application setup
- GitHub Actions CI/CD
- CI on every push and pull request: backend tests, frontend lint and build
- Deploys run only after tests pass
- Environment-based configuration

---

# 🏗️ Architecture


                    ┌──────────────────────┐
                    │      React App       │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │
                               │ Axios / HTTP
                               ▼
                    ┌──────────────────────┐
                    │   Node.js + Express  │
                    │      REST API        │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
          Routes          Middleware       Controllers
              │                │                │
              │         JWT / Authorization    │
              │                                 │
              └────────────────┬────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     PostgreSQL       │
                    │       Database       │
                    └──────────────────────┘


---

# ⚙️ Getting Started

## 1. Backend

```bash
cd backend
npm install
cp .env.example .env      # then fill in the values
npm run db:init           # create tables
npm run db:seed           # optional: admin user + sample products
npm run dev               # http://localhost:3000
```

### Environment variables (`backend/.env`)

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `DATABASE_URL` | ✅ | `postgres://user:pass@host/db` | PostgreSQL connection (Neon) |
| `JWT_SECRET` | ✅ | long random string | Signs login tokens. The server won't start without it |
| `JWT_EXPIRES_IN` | | `7d` | Token lifetime |
| `PORT` | | `3000` | API port |
| `CORS_ORIGIN` | in production | `https://myshop.vercel.app,http://localhost:5173` | Allowed frontend origins (comma-separated) |
| `AUTH_RATE_LIMIT_MAX` | | `20` | Login/register attempts per IP per 15 min |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | for seeding | | Admin account created by `npm run db:seed` |

## 2. Frontend

```bash
cd frontend
npm install
echo "VITE_API_URL=http://localhost:3000/api" > .env
npm run dev               # http://localhost:5173
```

## 3. Or run everything with Docker

```bash
docker compose up --build   # frontend: http://localhost:8080, API: http://localhost:3000
```

---

# 🧪 Testing

```bash
cd backend
npm test
```

The tests use Node's built-in test runner and a fake database, so they need no Postgres and finish in about a second. They cover:

- registration validation, duplicate emails, password hashing, forced `customer` role
- login: identical errors for an unknown email and a wrong password, token contents
- missing, forged and expired tokens (401) and customers on admin routes (403)
- cart quantity validation and stock limits
- checkout: empty cart, insufficient stock, row locking, totals, rollback on failure
- order status validation, dashboard stats, error handling and rate limiting

---

# 🔌 API Overview

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Public (rate limited) |
| GET | `/api/auth/me` | Logged in |
| GET | `/api/products`, `/api/products/:id` | Public |
| POST / PUT / DELETE | `/api/products/:id` | Admin |
| GET | `/api/categories`, `/api/categories/:id` | Public |
| POST / PUT / DELETE | `/api/categories/:id` | Admin |
| GET / POST / PUT / DELETE | `/api/cart` | Logged in |
| POST / GET | `/api/orders`, `/api/orders/:id` | Logged in (own orders only) |
| GET / PUT | `/api/admin/orders`, `/api/admin/orders/:id/status` | Admin |
| GET | `/api/admin/dashboard/stats` | Admin |
| GET | `/api/health` | Public (checks the database too) |

---

# 🚧 Known Limitations & Next Steps

- **Tokens are stored in `localStorage`**, which an XSS bug could read. An httpOnly cookie would be safer.
- **Logout only happens in the browser.** A copied token stays valid until it expires, and role changes take effect only when a new token is issued.
- **The rate limiter keeps counts in memory**, per server instance, and resets on restart. Multiple instances would need a shared store such as Redis.
- **The schema is managed with plain SQL files**, not versioned migrations (e.g. node-pg-migrate).
- **The frontend has no automated tests yet.**
- **No payment integration.** Orders are created as `pending`.
- **Next:** search, image uploads, customer order cancellation with stock restore, Swagger docs.

