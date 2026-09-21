import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../services/api";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/admin/dashboard/stats"
        );

        setStats(response.data.stats);

        setRecentOrders(
          response.data.recent_orders || []
        );
      } catch (error) {
        console.error(
          "Failed to fetch dashboard:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-warning text-dark";

      case "processing":
        return "bg-info text-dark";

      case "shipped":
        return "bg-primary";

      case "delivered":
        return "bg-success";

      case "cancelled":
        return "bg-danger";

      default:
        return "bg-secondary";
    }
  };

  // Loading
  if (loading) {
    return (
      <div className="text-center py-5">
        <div
          className="spinner-border text-primary"
          role="status"
        >
          <span className="visually-hidden">
            Loading...
          </span>
        </div>

        <p className="mt-3">
          Loading dashboard...
        </p>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div>
        <h1 className="mb-4">
          Admin Dashboard
        </h1>

        <div className="alert alert-danger">
          {error}
        </div>
      </div>
    );
  }

  // No data
  if (!stats) {
    return (
      <div className="alert alert-warning">
        No dashboard data available.
      </div>
    );
  }

  return (
    <div>
      {/* =========================
          HEADER
      ========================== */}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Admin Dashboard</h1>

          <p className="text-muted mb-0">
            Overview of your e-commerce store.
          </p>
        </div>

        {/* Admin Management Buttons */}

        <div className="d-flex gap-2">
          <Link
            to="/admin/products"
            className="btn btn-outline-primary"
          >
            Manage Products
          </Link>

          <Link
            to="/admin/categories"
            className="btn btn-outline-primary"
          >
            Manage Categories
          </Link>

          <Link
            to="/admin/orders"
            className="btn btn-primary"
          >
            Manage Orders
          </Link>
        </div>
      </div>

      {/* =========================
          STATISTICS
      ========================== */}

      <div className="row g-4">
        {/* Total Users */}

        <div className="col-md-6 col-xl-3">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">
                Total Users
              </h6>

              <h2 className="mb-0">
                {stats.total_users ?? 0}
              </h2>

              <small className="text-muted">
                Registered users
              </small>
            </div>
          </div>
        </div>

        {/* Total Products */}

        <div className="col-md-6 col-xl-3">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">
                Total Products
              </h6>

              <h2 className="mb-0">
                {stats.total_products ?? 0}
              </h2>

              <small className="text-muted">
                Products in catalog
              </small>

              <div className="mt-3">
                <Link
                  to="/admin/products"
                  className="btn btn-sm btn-outline-primary"
                >
                  Manage Products
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Total Orders */}

        <div className="col-md-6 col-xl-3">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">
                Total Orders
              </h6>

              <h2 className="mb-0">
                {stats.total_orders ?? 0}
              </h2>

              <small className="text-muted">
                All customer orders
              </small>
            </div>
          </div>
        </div>

        {/* Total Revenue */}

        <div className="col-md-6 col-xl-3">
          <div className="card h-100 shadow-sm">
            <div className="card-body">
              <h6 className="text-muted">
                Total Revenue
              </h6>

              <h2 className="mb-0">
                €
                {Number(
                  stats.total_revenue ?? 0
                ).toFixed(2)}
              </h2>

              <small className="text-muted">
                Excluding cancelled orders
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          ORDER STATUS
      ========================== */}

      <div className="card mt-4 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">
              Order Status
            </h4>

            <Link
              to="/admin/orders"
              className="btn btn-outline-primary btn-sm"
            >
              View All Orders
            </Link>
          </div>

          <div className="row g-3">
            {/* Pending */}

            <div className="col-md-3">
              <div className="border rounded p-3 h-100">
                <small className="text-muted">
                  Pending
                </small>

                <h4 className="mb-2">
                  {stats.pending_orders ?? 0}
                </h4>

                <span className="badge bg-warning text-dark">
                  Pending Orders
                </span>
              </div>
            </div>

            {/* Processing */}

            <div className="col-md-3">
              <div className="border rounded p-3 h-100">
                <small className="text-muted">
                  Processing
                </small>

                <h4 className="mb-2">
                  {stats.processing_orders ?? 0}
                </h4>

                <span className="badge bg-info text-dark">
                  Processing Orders
                </span>
              </div>
            </div>

            {/* Shipped */}

            <div className="col-md-3">
              <div className="border rounded p-3 h-100">
                <small className="text-muted">
                  Shipped
                </small>

                <h4 className="mb-2">
                  {stats.shipped_orders ?? 0}
                </h4>

                <span className="badge bg-primary">
                  Shipped Orders
                </span>
              </div>
            </div>

            {/* Delivered */}

            <div className="col-md-3">
              <div className="border rounded p-3 h-100">
                <small className="text-muted">
                  Delivered
                </small>

                <h4 className="mb-2">
                  {stats.delivered_orders ?? 0}
                </h4>

                <span className="badge bg-success">
                  Delivered Orders
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          RECENT ORDERS
      ========================== */}

      <div className="card mt-4 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4 className="mb-0">
              Recent Orders
            </h4>

            <Link
              to="/admin/orders"
              className="btn btn-outline-primary btn-sm"
            >
              View All
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-0">
                No recent orders found.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      {/* Order */}

                      <td>
                        <strong>
                          #{order.id}
                        </strong>
                      </td>

                      {/* Customer */}

                      <td>
                        <strong>
                          {order.customer_name}
                        </strong>

                        <br />

                        <small className="text-muted">
                          {order.customer_email}
                        </small>
                      </td>

                      {/* Date */}

                      <td>
                        {new Date(
                          order.created_at
                        ).toLocaleDateString()}
                      </td>

                      {/* Total */}

                      <td>
                        <strong>
                          €
                          {Number(
                            order.total_amount
                          ).toFixed(2)}
                        </strong>
                      </td>

                      {/* Status */}

                      <td>
                        <span
                          className={`badge ${getStatusClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Action */}

                      <td>
                        <Link
                          to={`/admin/orders/${order.id}`}
                          className="btn btn-sm btn-outline-primary"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;