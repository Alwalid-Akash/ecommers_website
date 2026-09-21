import { Routes, Route, Link } from "react-router-dom";

import Navbar from "./components/Navbar";

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
    <div className="text-center py-5">
      <h1>Welcome to E-Commerce</h1>

      <p className="text-muted">
        Find the products you need.
      </p>

      <Link
        to="/products"
        className="btn btn-primary mt-3"
      >
        Browse Products
      </Link>
    </div>
  );
}

function App() {
  return (
    <>
      <Navbar />

      <main className="container mt-4">
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
    </>
  );
}

export default App;