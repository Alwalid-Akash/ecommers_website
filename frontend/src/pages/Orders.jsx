import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/orders");

        setOrders(response.data.orders ?? []);
      } catch (error) {
        console.error(error);
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
    return <p>Loading orders...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <h1 className="mb-4">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-5">
          <h3>No orders yet</h3>
          <p className="text-muted">
            You haven't placed any orders yet.
          </p>
          <Link to="/products" className="btn btn-primary">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="row g-4">
          {orders.map((order) => (
            <div className="col-12" key={order.id}>
              <div className="card">
                <div className="card-body">
                  <div className="row align-items-center">
                    <div className="col-md-2">
                      <small className="text-muted">Order</small>
                      <h5 className="mb-0">#{order.id}</h5>
                    </div>

                    <div className="col-md-3">
                      <small className="text-muted">Date</small>
                      <p className="mb-0">
                        {new Date(
                          order.created_at
                        ).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="col-md-2">
                      <small className="text-muted">Total</small>
                      <p className="mb-0 fw-bold">
                        €{order.total_amount}
                      </p>
                    </div>

                    <div className="col-md-2">
                      <small className="text-muted d-block mb-1">
                        Status
                      </small>
                      <span
                        className={`badge ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="col-md-3 text-md-end mt-3 mt-md-0">
                      <Link
                        to={`/orders/${order.id}`}
                        className="btn btn-outline-primary"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;