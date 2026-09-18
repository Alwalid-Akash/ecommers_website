import { useEffect, useState } from "react";
import api from "../../services/api";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/admin/dashboard/stats"
        );

        setStats(response.data.stats);
      } catch (error) {
        console.error(
          "Failed to fetch dashboard stats:",
          error
        );

        setError(
          error.response?.data?.message ||
          "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

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
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger">
        {error}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="alert alert-warning">
        No dashboard data available.
      </div>
    );
  }

  return (
    <div>

      {/* Header */}
      <div className="mb-4">
        <h1>Admin Dashboard</h1>

        <p className="text-muted">
          Overview of your e-commerce store.
        </p>
      </div>


      {/* Statistics */}
      <div className="row g-4">

        {/* Users */}
        <div className="col-md-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted">
                Total Users
              </h6>

              <h2 className="mb-0">
                {stats.total_users ?? 0}
              </h2>
            </div>
          </div>
        </div>


        {/* Products */}
        <div className="col-md-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted">
                Total Products
              </h6>

              <h2 className="mb-0">
                {stats.total_products ?? 0}
              </h2>
            </div>
          </div>
        </div>


        {/* Orders */}
        <div className="col-md-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted">
                Total Orders
              </h6>

              <h2 className="mb-0">
                {stats.total_orders ?? 0}
              </h2>
            </div>
          </div>
        </div>


        {/* Revenue */}
        <div className="col-md-6 col-xl-3">
          <div className="card h-100">
            <div className="card-body">
              <h6 className="text-muted">
                Total Revenue
              </h6>

              <h2 className="mb-0">
                €{stats.total_revenue ?? 0}
              </h2>
            </div>
          </div>
        </div>

      </div>


      {/* Order Status */}
      <div className="card mt-4">

        <div className="card-body">

          <h4 className="mb-4">
            Order Status
          </h4>

          <div className="row g-3">

            <div className="col-md-3">
              <div className="border rounded p-3">
                <small className="text-muted">
                  Pending
                </small>

                <h4 className="mb-0">
                  {stats.pending_orders ?? 0}
                </h4>
              </div>
            </div>

            <div className="col-md-3">
              <div className="border rounded p-3">
                <small className="text-muted">
                  Processing
                </small>

                <h4 className="mb-0">
                  {stats.processing_orders ?? 0}
                </h4>
              </div>
            </div>

            <div className="col-md-3">
              <div className="border rounded p-3">
                <small className="text-muted">
                  Shipped
                </small>

                <h4 className="mb-0">
                  {stats.shipped_orders ?? 0}
                </h4>
              </div>
            </div>

            <div className="col-md-3">
              <div className="border rounded p-3">
                <small className="text-muted">
                  Delivered
                </small>

                <h4 className="mb-0">
                  {stats.delivered_orders ?? 0}
                </h4>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;