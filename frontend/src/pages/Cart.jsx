import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Cart() {
  const {
    cart,
    loading,
    updateCartItem,
    removeFromCart,
    clearCart,
  } = useCart();

  if (loading) {
    return <p>Loading cart...</p>;
  }

  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="text-center py-5">
        <h2>Your cart is empty</h2>

        <p className="text-muted">
          Add some products to your cart.
        </p>

        <Link to="/products" className="btn btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Your Cart</h1>

        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={clearCart}
        >
          Clear Cart
        </button>
      </div>

      <div className="row">
        <div className="col-lg-8">
          {items.map((item) => (
            <div className="card mb-3" key={item.id}>
              <div className="card-body">
                <div className="row align-items-center">
                  <div className="col-md-4">
                    <h5>{item.name}</h5>
                    <p className="text-muted mb-0">€{item.price}</p>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Quantity</label>

                    <input
                      type="number"
                      min="1"
                      max={item.stock}
                      className="form-control"
                      value={item.quantity}
                      onChange={(event) =>
                        updateCartItem(
                          item.product_id,
                          Number(event.target.value)
                        )
                      }
                    />
                  </div>

                  <div className="col-md-3">
                    <strong>€{item.subtotal}</strong>
                  </div>

                  <div className="col-md-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeFromCart(item.product_id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="col-lg-4">
          <div className="card">
            <div className="card-body">
              <h4>Order Summary</h4>

              <hr />

              <div className="d-flex justify-content-between">
                <span>Total</span>
                <strong>€{cart?.total ?? 0}</strong>
              </div>

              <Link
                to="/checkout"
                className="btn btn-primary w-100 mt-4"
              >
                Proceed to Checkout
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;