import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

function OrderDetails() {
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/orders/${id}`);

        setOrder({
          ...response.data.order,
          items: response.data.items ?? [],
        });
      } catch (error) {
        console.error(error);
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
    return <p>Loading order...</p>;
  }

  if (error) {
    return (
      <div>
        <div className="alert alert-danger">{error}</div>
        <Link
          to="/orders"
          className="btn btn-outline-secondary"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="alert alert-danger">
        Order not found.
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Order #{order.id}</h1>
          <p className="text-muted mb-0">
            Placed on{" "}
            {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>

        <span
          className={`badge fs-6 ${getStatusClass(
            order.status
          )}`}
        >
          {order.status}
        </span>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h4 className="mb-4">Order Items</h4>

          {order.items.map((item) => (
            <div
              key={item.id}
              className="d-flex justify-content-between align-items-center border-bottom py-3"
            >
              <div>
                <h6 className="mb-1">{item.name}</h6>
                <small className="text-muted">
                  €{item.price} × {item.quantity}
                </small>
              </div>

              <strong>€{item.subtotal}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="row justify-content-end">
        <div className="col-md-5">
          <div className="card">
            <div className="card-body">
              <h4>Order Summary</h4>
              <hr />

              <div className="d-flex justify-content-between mb-2">
                <span>Items</span>
                <span>
                  {order.items.reduce(
                    (total, item) => total + item.quantity,
                    0
                  )}
                </span>
              </div>

              <div className="d-flex justify-content-between">
                <strong>Total</strong>
                <strong>€{order.total_amount}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <Link
          to="/orders"
          className="btn btn-outline-secondary"
        >
          ← Back to Orders
        </Link>
      </div>
    </div>
  );
}

export default OrderDetails;