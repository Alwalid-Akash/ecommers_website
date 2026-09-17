import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();

  const cartItems = cart?.items || [];

  const cartCount = cartItems.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">

        {/* Brand */}
        <Link
          to="/"
          className="navbar-brand fw-bold"
        >
          E-Commerce
        </Link>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
          aria-controls="navbarContent"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navbar Content */}
        <div
          className="collapse navbar-collapse"
          id="navbarContent"
        >

          {/* Left Side */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">

            <li className="nav-item">
              <Link to="/" className="nav-link">
                Home
              </Link>
            </li>

            <li className="nav-item">
              <Link to="/products" className="nav-link">
                Products
              </Link>
            </li>

            {isAuthenticated && (
              <>
                <li className="nav-item">
                  <Link to="/cart" className="nav-link">
                    Cart{" "}
                    {cartCount > 0 && (
                      <span className="badge bg-danger">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </li>

                <li className="nav-item">
                  <Link to="/orders" className="nav-link">
                    Orders
                  </Link>
                </li>
              </>
            )}

          </ul>

          {/* Right Side */}
          <ul className="navbar-nav align-items-lg-center">

            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <span className="nav-link">
                    Hello, {user?.name}
                  </span>
                </li>

                {user?.role === "admin" && (
                  <li className="nav-item">
                    <Link
                      to="/admin"
                      className="nav-link"
                    >
                      Admin
                    </Link>
                  </li>
                )}

                <li className="nav-item">
                  <button
                    onClick={handleLogout}
                    className="btn btn-outline-light btn-sm ms-lg-2"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link
                    to="/login"
                    className="nav-link"
                  >
                    Login
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    to="/register"
                    className="btn btn-primary btn-sm ms-lg-2"
                  >
                    Register
                  </Link>
                </li>
              </>
            )}

          </ul>

        </div>
      </div>
    </nav>
  );
}

export default Navbar;