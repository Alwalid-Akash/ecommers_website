import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api";

function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const editMode = Boolean(id);

  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    category_id: "",
    image_url: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] =
    useState(editMode);

  const [error, setError] = useState("");

  // --------------------------------
  // LOAD CATEGORIES
  // --------------------------------

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response =
          await api.get("/categories");

        console.log(
          "CATEGORIES RESPONSE:",
          response.data
        );

        const data =
          response.data.categories ||
          response.data.data ||
          response.data;

        setCategories(
          Array.isArray(data) ? data : []
        );
      } catch (error) {
        console.error(
          "LOAD CATEGORIES ERROR:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Failed to load categories"
        );
      }
    };

    loadCategories();
  }, []);

  // --------------------------------
  // LOAD PRODUCT FOR EDIT
  // --------------------------------

  useEffect(() => {
    if (!editMode) {
      return;
    }

    const loadProduct = async () => {
      try {
        setLoadingProduct(true);
        setError("");

        const response =
          await api.get(`/products/${id}`);

        console.log(
          "PRODUCT RESPONSE:",
          response.data
        );

        const product =
          response.data.product ||
          response.data.data ||
          response.data;

        setFormData({
          name: product.name || "",
          description:
            product.description || "",
          price: product.price ?? "",
          stock: product.stock ?? "",
          category_id:
            product.category_id ?? "",
          image_url:
            product.image_url || "",
        });
      } catch (error) {
        console.error(
          "LOAD PRODUCT ERROR:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Failed to load product"
        );
      } finally {
        setLoadingProduct(false);
      }
    };

    loadProduct();
  }, [id, editMode]);

  // --------------------------------
  // INPUT CHANGE
  // --------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // --------------------------------
  // SUBMIT
  // --------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!formData.name.trim()) {
      setError("Product name is required.");
      return;
    }

    if (
      formData.price === "" ||
      Number(formData.price) < 0
    ) {
      setError("Enter a valid price.");
      return;
    }

    if (
      formData.stock === "" ||
      Number(formData.stock) < 0
    ) {
      setError("Enter a valid stock.");
      return;
    }

    const productData = {
      name: formData.name.trim(),
      description:
        formData.description.trim(),
      price: Number(formData.price),
      stock: Number(formData.stock),

      category_id:
        formData.category_id === ""
          ? null
          : Number(formData.category_id),

      image_url:
        formData.image_url.trim() || null,
    };

    try {
      setLoading(true);

      console.log(
        "SENDING PRODUCT DATA:",
        productData
      );

      if (editMode) {
        // UPDATE

        const response = await api.put(
          `/products/${id}`,
          productData
        );

        console.log(
          "UPDATE PRODUCT RESPONSE:",
          response.data
        );
      } else {
        // CREATE

        const response = await api.post(
          "/products",
          productData
        );

        console.log(
          "CREATE PRODUCT RESPONSE:",
          response.data
        );
      }

      navigate("/admin/products");
    } catch (error) {
      console.error(
        "SAVE PRODUCT ERROR:",
        error
      );

      console.error(
        "BACKEND RESPONSE:",
        error.response?.data
      );

      setError(
        error.response?.data?.message ||
        "Failed to save product"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="text-center py-5">
        <div
          className="spinner-border"
          role="status"
        />

        <p className="mt-3">
          Loading product...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>
            {editMode
              ? "Edit Product"
              : "Add Product"}
          </h1>

          <p className="text-muted">
            {editMode
              ? "Update product information."
              : "Create a new product."}
          </p>
        </div>

        <Link
          to="/admin/products"
          className="btn btn-outline-secondary"
        >
          Back
        </Link>
      </div>

      {/* ERROR */}

      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      {/* FORM */}

      <div className="card shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* NAME */}

            <div className="mb-3">
              <label
                className="form-label"
                htmlFor="name"
              >
                Product Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* DESCRIPTION */}

            <div className="mb-3">
              <label
                className="form-label"
                htmlFor="description"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows="4"
                className="form-control"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="row">
              {/* PRICE */}

              <div className="col-md-6 mb-3">
                <label
                  className="form-label"
                  htmlFor="price"
                >
                  Price
                </label>

                <input
                  id="price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="form-control"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* STOCK */}

              <div className="col-md-6 mb-3">
                <label
                  className="form-label"
                  htmlFor="stock"
                >
                  Stock
                </label>

                <input
                  id="stock"
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  className="form-control"
                  value={formData.stock}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="row">
              {/* CATEGORY */}

              <div className="col-md-6 mb-3">
                <label
                  className="form-label"
                  htmlFor="category_id"
                >
                  Category
                </label>

                <select
                  id="category_id"
                  name="category_id"
                  className="form-select"
                  value={formData.category_id}
                  onChange={handleChange}
                >
                  <option value="">
                    No Category
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={category.id}
                        value={category.id}
                      >
                        {category.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* IMAGE */}

              <div className="col-md-6 mb-3">
                <label
                  className="form-label"
                  htmlFor="image_url"
                >
                  Image URL
                </label>

                <input
                  id="image_url"
                  name="image_url"
                  type="url"
                  className="form-control"
                  value={formData.image_url}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* BUTTONS */}

            <div className="d-flex gap-2 mt-4">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : editMode
                    ? "Update Product"
                    : "Create Product"}
              </button>

              <Link
                to="/admin/products"
                className="btn btn-secondary"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminProductForm;