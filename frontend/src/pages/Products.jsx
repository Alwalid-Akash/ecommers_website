import { useEffect, useState } from "react";
import api from "../services/api";
import ProductCard from "./ProductCard";

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get("/products");
        setProducts(response.data.products);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <p>Loading...</p>;
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