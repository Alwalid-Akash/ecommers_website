import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { cart } = useCart();

  const cartCount =
    cart?.items?.reduce((total, item) => total + item.quantity, 0) || 0;

  return (
    <nav className="navbar navbar-expand-lg bg-dark navbar-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">
          E-Commerce
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

<<<<<<< Updated upstream
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/products">Products</Link>
=======
        {/* Navbar Content */}
        <div
          className="collapse navbar-collapse"
          id="navbarContent"
        >

          {/* Left Side */}
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">



            <li className="nav-item">
              <Link to="/products" className="nav-link">
                Home
              </Link>
>>>>>>> Stashed changes
            </li>

            <li className="nav-item">
              <Link className="nav-link" to="/cart">
                Cart{cartCount > 0 && ` (${cartCount})`}
              </Link>
            </li>

            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/orders">Orders</Link>
                </li>

                <li className="nav-item">
                  <span className="nav-link">Hi, {user?.name}</span>
                </li>

                <li className="nav-item">
                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm mt-1"
                    onClick={logout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>

                <li className="nav-item">
                  <Link className="nav-link" to="/register">Register</Link>
                  <Link
                    className="nav-link"
                    to="/cart"
                  >
                    Cart ({cartCount})
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