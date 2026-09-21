import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../services/api";

function AdminProducts() {
  const [products, setProducts] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");

      setProducts(response.data.products || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);

      setError(
        error.response?.data?.message ||
        "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(productId);
      setError("");

      await api.delete(`/products/${productId}`);

      setProducts((currentProducts) =>
        currentProducts.filter(
          (product) => product.id !== productId
        )
      );
    } catch (error) {
      console.error("Failed to delete product:", error);

      setError(
        error.response?.data?.message ||
        "Failed to delete product"
      );
    } finally {
      setDeleteLoading(null);
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
          Loading products...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Manage Products</h1>

          <p className="text-muted mb-0">
            Add, edit, and manage your products.
          </p>
        </div>

        <div className="d-flex gap-2">
          <Link
            to="/admin"
            className="btn btn-outline-secondary"
          >
            Dashboard
          </Link>

          <Link
            to="/admin/products/new"
            className="btn btn-primary"
          >
            + Add Product
          </Link>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* EMPTY STATE */}
      {products.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <h4>No products found</h4>

            <p className="text-muted">
              You haven't added any products yet.
            </p>

            <Link
              to="/admin/products/new"
              className="btn btn-primary"
            >
              Add Your First Product
            </Link>
          </div>
        </div>
      ) : (
        /* PRODUCT TABLE */
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">
                Products
              </h4>

              <span className="badge bg-secondary">
                {products.length} Products
              </span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        #{product.id}
                      </td>

                      <td>
                        <strong>
                          {product.name}
                        </strong>

                        {product.description && (
                          <div>
                            <small className="text-muted">
                              {product.description.length > 60
                                ? `${product.description.substring(
                                  0,
                                  60
                                )}...`
                                : product.description}
                            </small>
                          </div>
                        )}
                      </td>

                      <td>
                        {product.category_name || (
                          <span className="text-muted">
                            No category
                          </span>
                        )}
                      </td>

                      <td>
                        <strong>
                          €
                          {Number(
                            product.price
                          ).toFixed(2)}
                        </strong>
                      </td>

                      <td>
                        {product.stock === 0 ? (
                          <span className="badge bg-danger">
                            Out of stock
                          </span>
                        ) : product.stock < 10 ? (
                          <span className="badge bg-warning text-dark">
                            {product.stock} left
                          </span>
                        ) : (
                          <span className="badge bg-success">
                            {product.stock}
                          </span>
                        )}
                      </td>

                      <td>
                        {product.created_at
                          ? new Date(
                            product.created_at
                          ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>
                        <div className="d-flex gap-2">
                          <Link
                            to={`/admin/products/${product.id}/edit`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              handleDelete(product.id)
                            }
                            disabled={
                              deleteLoading === product.id
                            }
                          >
                            {deleteLoading === product.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
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

export default AdminProducts;