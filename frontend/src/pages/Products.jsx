import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import ProductCard from "./ProductCard";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("default");

  const [currentPage, setCurrentPage] = useState(1);

  const productsPerPage = 8;

  /* ---------------- FETCH DATA ---------------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [productsResponse, categoriesResponse] = await Promise.all([
          api.get("/products"),
          api.get("/categories"),
        ]);

        // 🔍 Log to inspect actual API shape (remove in production)
        console.log("Products raw:", productsResponse.data);
        console.log("Categories raw:", categoriesResponse.data);

        // Flexible unwrap — handles different response shapes
        const productsList =
          productsResponse.data?.products ??
          productsResponse.data?.data ??
          productsResponse.data ??
          [];

        const categoriesList =
          categoriesResponse.data?.categories ??
          categoriesResponse.data?.data ??
          categoriesResponse.data ??
          [];

        setProducts(Array.isArray(productsList) ? productsList : []);
        setCategories(Array.isArray(categoriesList) ? categoriesList : []);

        if (productsList[0]) console.log("Sample product:", productsList[0]);
        if (categoriesList[0]) console.log("Sample category:", categoriesList[0]);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(
          err.response?.data?.message ||
          "Failed to load products"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /* ---------------- FILTER + SORT ---------------- */
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // --- Search ---
    if (search.trim()) {
      const searchText = search.toLowerCase();
      result = result.filter((product) =>
        (product.name || "").toLowerCase().includes(searchText)
      );
    }

    // --- Category ---
    if (category !== "all") {
      result = result.filter((product) => {
        // Try every common field name for category id
        const productCatId =
          product.category_id ??
          product.categoryId ??
          product.category?.id ??
          product.category?._id ??
          product.category;

        return String(productCatId) === String(category);
      });
    }

    // --- Sorting ---
    switch (sort) {
      case "price-low":
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-high":
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "name-asc":
        result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        break;
      case "name-desc":
        result.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
        break;
      default:
        break;
    }

    return result;
  }, [products, search, category, sort]);

  /* ---------------- PAGINATION ---------------- */
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;

  const currentProducts = filteredProducts.slice(
    startIndex,
    startIndex + productsPerPage
  );

  /* ---------------- HANDLERS ---------------- */
  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (event) => {
    setSort(event.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading products...</p>
      </div>
    );
  }

  /* ---------------- ERROR ---------------- */
  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  /* ---------------- RENDER ---------------- */
  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Products</h1>
        <span className="text-muted">
          {filteredProducts.length} products
        </span>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            {/* Search */}
            <div className="col-md-5">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search products..."
                value={search}
                onChange={handleSearchChange}
              />
            </div>

            {/* Category */}
            <div className="col-md-3">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={handleCategoryChange}
              >
                <option value="all">All Categories</option>

                {categories.map((item) => {
                  const id = item.id ?? item._id ?? item.category_id;
                  const name = item.name ?? item.title ?? item.categoryName;

                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Sort */}
            <div className="col-md-4">
              <label className="form-label">Sort By</label>
              <select
                className="form-select"
                value={sort}
                onChange={handleSortChange}
              >
                <option value="default">Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      {currentProducts.length === 0 ? (
        <div className="text-center py-5">
          <h3>No products found</h3>
          <p className="text-muted">
            Try changing your search or filters.
          </p>
        </div>
      ) : (
        <div className="row">
          {currentProducts.map((product) => (
            <div
              className="col-sm-6 col-md-4 col-lg-3 mb-4"
              key={product.id ?? product._id}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4" aria-label="Product pagination">
          <ul className="pagination justify-content-center">
            {/* Previous */}
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
            </li>

            {/* Pages */}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <li
                key={page}
                className={`page-item ${currentPage === page ? "active" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              </li>
            ))}

            {/* Next */}
            <li
              className={`page-item ${currentPage === totalPages ? "disabled" : ""
                }`}
            >
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
}

export default Products;