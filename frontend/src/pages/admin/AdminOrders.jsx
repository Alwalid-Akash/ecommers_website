import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../services/api";

function AdminOrders() {
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/admin/orders");

        setOrders(response.data.orders || []);
      } catch (error) {
        console.error(
          "Failed to fetch admin orders:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Failed to load orders"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
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
          Loading orders...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="mb-4">
          Manage Orders
        </h1>

        <div className="alert alert-danger">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Manage Orders</h1>

          <p className="text-muted mb-0">
            View and manage customer orders.
          </p>
        </div>

        <Link
          to="/admin"
          className="btn btn-outline-secondary"
        >
          ← Dashboard
        </Link>
      </div>

      {/* Orders */}

      {orders.length === 0 ? (
        <div className="card">
          <div className="card-body text-center py-5">
            <h4>No orders found</h4>

            <p className="text-muted mb-0">
              There are currently no customer orders.
            </p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body">
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
                  {orders.map((order) => (
                    <tr key={order.id}>
                      {/* Order ID */}

                      <td>
                        <strong>
                          #{order.id}
                        </strong>
                      </td>

                      {/* Customer */}

                      <td>
                        <div>
                          <strong>
                            {order.customer_name}
                          </strong>

                          <br />

                          <small className="text-muted">
                            {order.customer_email}
                          </small>
                        </div>
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
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminOrders;