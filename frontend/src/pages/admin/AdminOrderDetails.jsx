import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../../services/api";

function AdminOrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);

  const [status, setStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/admin/orders/${id}`
        );

        const orderData = response.data.order;

        setOrder(orderData);
        setStatus(orderData.status);
      } catch (error) {
        console.error(
          "Failed to fetch order:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Failed to load order"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleStatusUpdate = async () => {
    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      const response = await api.put(
        `/admin/orders/${id}/status`,
        {
          status,
        }
      );

      setOrder((previousOrder) => ({
        ...previousOrder,
        status: response.data.order.status,
        updated_at: response.data.order.updated_at,
      }));

      setSuccess(
        "Order status updated successfully."
      );
    } catch (error) {
      console.error(
        "Failed to update order status:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Failed to update order status"
      );
    } finally {
      setUpdating(false);
    }
  };

  const getStatusClass = (orderStatus) => {
    switch (orderStatus) {
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
          Loading order...
        </p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div>
        <div className="alert alert-danger">
          {error}
        </div>

        <Link
          to="/admin/orders"
          className="btn btn-outline-secondary"
        >
          ← Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="alert alert-warning">
        Order not found.
      </div>
    );
  }

  return (
    <div>
      {/* Header */}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>
            Order #{order.id}
          </h1>

          <p className="text-muted mb-0">
            Created{" "}
            {new Date(
              order.created_at
            ).toLocaleString()}
          </p>
        </div>

        <Link
          to="/admin/orders"
          className="btn btn-outline-secondary"
        >
          ← Back to Orders
        </Link>
      </div>

      {/* Messages */}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
        </div>
      )}

      <div className="row g-4">
        {/* Customer information */}

        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="mb-4">
                Customer
              </h4>

              <p className="mb-2">
                <strong>Name:</strong>{" "}
                {order.customer_name}
              </p>

              <p className="mb-2">
                <strong>Email:</strong>{" "}
                {order.customer_email}
              </p>

              <p className="mb-0">
                <strong>User ID:</strong>{" "}
                {order.user_id}
              </p>
            </div>
          </div>
        </div>

        {/* Order status */}

        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="mb-4">
                Order Status
              </h4>

              <p>
                Current status:
              </p>

              <span
                className={`badge fs-6 mb-4 ${getStatusClass(
                  order.status
                )}`}
              >
                {order.status}
              </span>

              <label
                htmlFor="orderStatus"
                className="form-label"
              >
                Change status
              </label>

              <select
                id="orderStatus"
                className="form-select"
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
              >
                <option value="pending">
                  Pending
                </option>

                <option value="processing">
                  Processing
                </option>

                <option value="shipped">
                  Shipped
                </option>

                <option value="delivered">
                  Delivered
                </option>

                <option value="cancelled">
                  Cancelled
                </option>
              </select>

              <button
                type="button"
                className="btn btn-primary w-100 mt-3"
                onClick={handleStatusUpdate}
                disabled={
                  updating ||
                  status === order.status
                }
              >
                {updating
                  ? "Updating..."
                  : "Update Status"}
              </button>
            </div>
          </div>
        </div>

        {/* Order summary */}

        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-body">
              <h4 className="mb-4">
                Order Summary
              </h4>

              <div className="d-flex justify-content-between mb-2">
                <span>
                  Items
                </span>

                <span>
                  {order.items?.reduce(
                    (total, item) =>
                      total +
                      Number(item.quantity),
                    0
                  ) || 0}
                </span>
              </div>

              <hr />

              <div className="d-flex justify-content-between">
                <strong>
                  Total
                </strong>

                <strong>
                  €
                  {Number(
                    order.total_amount
                  ).toFixed(2)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}

      <div className="card mt-4">
        <div className="card-body">
          <h4 className="mb-4">
            Order Items
          </h4>

          {order.items?.length === 0 ? (
            <p className="text-muted">
              No order items found.
            </p>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Product ID</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>

                <tbody>
                  {order.items?.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          {item.product_name}
                        </strong>
                      </td>

                      <td>
                        {item.product_id}
                      </td>

                      <td>
                        €
                        {Number(
                          item.price
                        ).toFixed(2)}
                      </td>

                      <td>
                        {item.quantity}
                      </td>

                      <td>
                        <strong>
                          €
                          {Number(
                            item.subtotal
                          ).toFixed(2)}
                        </strong>
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

export default AdminOrderDetails;