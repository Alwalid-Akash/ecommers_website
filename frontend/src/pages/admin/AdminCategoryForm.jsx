import { useEffect, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import api from "../../services/api";

function AdminCategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();

  const editMode = Boolean(id);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [loadingCategory, setLoadingCategory] =
    useState(editMode);

  const [error, setError] = useState("");

  // --------------------------------
  // LOAD CATEGORY
  // --------------------------------

  useEffect(() => {
    if (!editMode) {
      return;
    }

    const loadCategory = async () => {
      try {
        setLoadingCategory(true);
        setError("");

        const response =
          await api.get(`/categories/${id}`);

        console.log(
          "CATEGORY RESPONSE:",
          response.data
        );

        const category =
          response.data.category ||
          response.data.data ||
          response.data;

        setFormData({
          name: category.name || "",
          description:
            category.description || "",
        });
      } catch (error) {
        console.error(
          "LOAD CATEGORY ERROR:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Failed to load category"
        );
      } finally {
        setLoadingCategory(false);
      }
    };

    loadCategory();
  }, [id, editMode]);

  // --------------------------------
  // INPUT
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
      setError("Category name is required.");
      return;
    }

    const categoryData = {
      name: formData.name.trim(),
      description:
        formData.description.trim(),
    };

    try {
      setLoading(true);

      console.log(
        "SENDING CATEGORY DATA:",
        categoryData
      );

      if (editMode) {
        const response = await api.put(
          `/categories/${id}`,
          categoryData
        );

        console.log(
          "UPDATE CATEGORY RESPONSE:",
          response.data
        );
      } else {
        const response = await api.post(
          "/categories",
          categoryData
        );

        console.log(
          "CREATE CATEGORY RESPONSE:",
          response.data
        );
      }

      navigate("/admin/categories");
    } catch (error) {
      console.error(
        "SAVE CATEGORY ERROR:",
        error
      );

      console.error(
        "BACKEND RESPONSE:",
        error.response?.data
      );

      setError(
        error.response?.data?.message ||
        "Failed to save category"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingCategory) {
    return (
      <div className="text-center py-5">
        <div
          className="spinner-border"
          role="status"
        />

        <p className="mt-3">
          Loading category...
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
              ? "Edit Category"
              : "Add Category"}
          </h1>

          <p className="text-muted">
            {editMode
              ? "Update category."
              : "Create a new category."}
          </p>
        </div>

        <Link
          to="/admin/categories"
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
            <div className="mb-3">
              <label
                htmlFor="name"
                className="form-label"
              >
                Category Name
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

            <div className="mb-3">
              <label
                htmlFor="description"
                className="form-label"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                rows="5"
                className="form-control"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : editMode
                    ? "Update Category"
                    : "Create Category"}
              </button>

              <Link
                to="/admin/categories"
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

export default AdminCategoryForm;