import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/${id}`);

        setProduct(response.data.product);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!product) {
    return <p>Product not found.</p>;
  }

  return (
    <div className="row">

      <div className="col-md-6">
        {product.image_url && (
          <img
            src={product.image_url}
            className="img-fluid"
            alt={product.name}
          />
        )}
      </div>

      <div className="col-md-6">

        <h1>{product.name}</h1>

        <p>{product.description}</p>

        <h2>€{product.price}</h2>

        <p>
          Available stock: {product.stock}
        </p>

        <button className="btn btn-primary">
          Add to Cart
        </button>

      </div>

    </div>
  );
}

export default ProductDetails;