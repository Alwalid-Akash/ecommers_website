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
- Input validation
- Environment variables for sensitive configuration
- PostgreSQL constraints

### 🐳 DevOps

- Docker
- Docker-based application setup
- GitHub Actions CI/CD
- Automated build/test workflow
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



