import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const navigate = useNavigate();

  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    try {
      setAdding(true);
      setMessage("");
      setError("");

      await addToCart(product.id, 1);

      setMessage("Added to cart");
    } catch (error) {
      setError(
        error.response?.data?.message ||
        "Failed to add product"
      );
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="card h-100">
      {product.image_url && (
        <img
          src={product.image_url}
          className="card-img-top"
          alt={product.name}
        />
      )}

      <div className="card-body d-flex flex-column">
        <h5 className="card-title">{product.name}</h5>
        <p className="card-text">{product.description}</p>

        <h5 className="mt-auto">€{product.price}</h5>
        <p className="text-muted">Stock: {product.stock}</p>

        {message && (
          <div className="alert alert-success py-2">
            {message}
          </div>
        )}

        {error && (
          <div className="alert alert-danger py-2">
            {error}
          </div>
        )}

        <div className="d-grid gap-2">
          <Link
            to={`/products/${product.id}`}
            className="btn btn-outline-primary"
          >
            View Product
          </Link>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddToCart}
            disabled={adding || product.stock === 0}
          >
            {product.stock === 0
              ? "Out of Stock"
              : adding
                ? "Adding..."
                : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;