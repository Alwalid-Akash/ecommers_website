import { Routes, Route, Link } from "react-router-dom";

import Navbar from "./components/Navbar";
import "./App.css";

import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";

import Login from "./pages/Login";
import Register from "./pages/Register";

import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";

import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminOrderDetails from "./pages/admin/AdminOrderDetails";

import AdminProducts from "./pages/admin/AdminProducts";
import AdminProductForm from "./pages/admin/AdminProductForm";

import AdminCategories from "./pages/admin/AdminCategories";
import AdminCategoryForm from "./pages/admin/AdminCategoryForm";

function Home() {
  return (
    <section className="home-hero">
      <div className="hero-copy">
        <span className="eyebrow">Welcome to E-Commerce</span>
        <h1>Everyday shopping,<br />made simple.</h1>
        <p>Browse our products, find what you need, and shop at your own pace.</p>
        <Link to="/products" className="btn btn-primary hero-button">Browse products <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}

function App() {
  return (
    <>
      <Navbar />

      <main className="container site-main">
        <Routes>

          {/* PUBLIC */}

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/products"
            element={<Products />}
          />

          <Route
            path="/products/:id"
            element={<ProductDetails />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />


          {/* CUSTOMER */}

          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            }
          />


          {/* ADMIN */}

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* ADMIN PRODUCTS */}

          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/products/new"
            element={
              <AdminRoute>
                <AdminProductForm />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/products/:id/edit"
            element={
              <AdminRoute>
                <AdminProductForm />
              </AdminRoute>
            }
          />


          {/* ADMIN CATEGORIES */}

          <Route
            path="/admin/categories"
            element={
              <AdminRoute>
                <AdminCategories />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/categories/new"
            element={
              <AdminRoute>
                <AdminCategoryForm />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/categories/:id/edit"
            element={
              <AdminRoute>
                <AdminCategoryForm />
              </AdminRoute>
            }
          />


          {/* ADMIN ORDERS */}

          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/orders/:id"
            element={
              <AdminRoute>
                <AdminOrderDetails />
              </AdminRoute>
            }
          />

        </Routes>
      </main>
      <footer className="site-footer">
        <div className="container footer-content">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">E-Commerce<span>.</span></Link>
            <p>Discover something you’ll love.<br />Make it part of your everyday.</p>
          </div>
          <nav aria-label="Footer shop navigation"><span className="footer-heading">Explore</span><Link to="/">Home</Link><Link to="/products">All products</Link></nav>
          <nav aria-label="Footer account navigation"><span className="footer-heading">Your account</span><Link to="/login">Sign in</Link><Link to="/register">Create an account</Link></nav>
        </div>
        <div className="container footer-bottom"><span>© {new Date().getFullYear()} E-Commerce</span><span>Made for your everyday.</span></div>
      </footer>
    </>
  );
}

export default App;