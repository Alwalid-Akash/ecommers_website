import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../services/api";
import { useCart } from "../context/CartContext";

function Checkout() {
  const { cart, loading, setCart } = useCart();
  const navigate = useNavigate();

  const [placingOrder, setPlacingOrder] = useState(false);
  const [error, setError] = useState("");

  const handlePlaceOrder = async () => {
    try {
      setError("");
      setPlacingOrder(true);

      const response = await api.post("/orders");

      setCart({ items: [], total: 0 });

      navigate(`/orders/${response.data.order.id}`);
    } catch (error) {
      console.error(error);
      setError(
        error.response?.data?.message ||
        "Failed to place order"
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loading) {
    return <p>Loading checkout...</p>;
  }

  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="text-center py-5">
        <h2>Your cart is empty</h2>
        <p className="text-muted">
          Add some products before checking out.
        </p>
        <Link to="/products" className="btn btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Checkout</h1>

      {error && (
        <div className="alert alert-danger">{error}</div>
      )}

      <div className="row">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-body">
              <h4 className="mb-4">Order Items</h4>

              {items.map((item) => (
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
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h4>Order Summary</h4>
              <hr />

              <div className="d-flex justify-content-between mb-2">
                <span>Items</span>
                <span>
                  {items.reduce(
                    (total, item) => total + item.quantity,
                    0
                  )}
                </span>
              </div>

              <div className="d-flex justify-content-between">
                <strong>Total</strong>
                <strong>€{cart?.total ?? 0}</strong>
              </div>

              <button
                className="btn btn-primary w-100 mt-4"
                onClick={handlePlaceOrder}
                disabled={placingOrder}
              >
                {placingOrder
                  ? "Placing Order..."
                  : "Place Order"}
              </button>

              <Link
                to="/cart"
                className="btn btn-outline-secondary w-100 mt-2"
              >
                Back to Cart
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;