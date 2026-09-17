import { useEffect, useState } from "react";
import api from "../services/api";
import ProductCard from "./ProductCard";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setError("");
        const response = await api.get("/products");
        setProducts(response.data.products ?? []);
      } catch (error) {
        console.error(error);
        setError(
          error.response?.data?.message ||
          "Failed to load products"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-5">
        <h3>No products available</h3>
        <p className="text-muted">
          Check back later for new items.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Products</h1>

      <div className="row">
        {products.map((product) => (
          <div
            className="col-md-4 col-lg-3 mb-4"
            key={product.id}
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Products;