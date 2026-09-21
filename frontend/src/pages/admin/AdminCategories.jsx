import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import api from "../../services/api";

function AdminCategories() {
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/categories");

      setCategories(response.data.categories || []);
    } catch (error) {
      console.error(
        "Failed to fetch categories:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleteLoading(categoryId);
      setError("");

      await api.delete(`/categories/${categoryId}`);

      setCategories((currentCategories) =>
        currentCategories.filter(
          (category) => category.id !== categoryId
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete category:",
        error
      );

      setError(
        error.response?.data?.message ||
        "Failed to delete category"
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
          Loading categories...
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1>Manage Categories</h1>

          <p className="text-muted mb-0">
            Add, edit, and manage product categories.
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
            to="/admin/categories/new"
            className="btn btn-primary"
          >
            + Add Category
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
      {categories.length === 0 ? (
        <div className="card shadow-sm">
          <div className="card-body text-center py-5">
            <h4>No categories found</h4>

            <p className="text-muted">
              You haven't created any categories yet.
            </p>

            <Link
              to="/admin/categories/new"
              className="btn btn-primary"
            >
              Add Your First Category
            </Link>
          </div>
        </div>
      ) : (
        /* CATEGORY TABLE */
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h4 className="mb-0">
                Categories
              </h4>

              <span className="badge bg-secondary">
                {categories.length} Categories
              </span>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>
                        #{category.id}
                      </td>

                      <td>
                        <strong>
                          {category.name}
                        </strong>
                      </td>

                      <td>
                        {category.description || (
                          <span className="text-muted">
                            No description
                          </span>
                        )}
                      </td>

                      <td>
                        {category.created_at
                          ? new Date(
                            category.created_at
                          ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>
                        <div className="d-flex gap-2">
                          <Link
                            to={`/admin/categories/${category.id}/edit`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            Edit
                          </Link>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() =>
                              handleDelete(category.id)
                            }
                            disabled={
                              deleteLoading ===
                              category.id
                            }
                          >
                            {deleteLoading === category.id
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

export default AdminCategories;