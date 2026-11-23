// A product card: photo, price, and the "Add to Cart" button.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import ProductCard from "../src/components/ProductCard";
import { useAuth } from "../src/context/AuthContext";
import { useCart } from "../src/context/CartContext";

vi.mock("../src/context/AuthContext", () => ({ useAuth: vi.fn() }));
vi.mock("../src/context/CartContext", () => ({ useCart: vi.fn() }));

const yogaMat = {
  id: 8,
  name: "Yoga Mat",
  description: "Non-slip mat",
  price: 24.9,
  stock: 12,
  image_url: "/images/products/yoga-mat.jpg",
};

function showCard({ product = yogaMat, loggedIn = true, addToCart = vi.fn().mockResolvedValue() } = {}) {
  useAuth.mockReturnValue({ isAuthenticated: loggedIn });
  useCart.mockReturnValue({ addToCart });
  render(
    <MemoryRouter initialEntries={["/products"]}>
      <Routes>
        <Route path="/products" element={<ProductCard product={product} />} />
        <Route path="/login" element={<p>Login page</p>} />
      </Routes>
    </MemoryRouter>
  );
  return { addToCart };
}

describe("ProductCard", () => {
  it("shows the product photo, name, price and a link to its page", () => {
    showCard();

    expect(screen.getByRole("img", { name: "Yoga Mat" })).toHaveAttribute("src", "/images/products/yoga-mat.jpg");
    expect(screen.getByText("€24.9")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View Product" })).toHaveAttribute("href", "/products/8");
  });

  it("adds one item to the cart and confirms it", async () => {
    const user = userEvent.setup();
    const { addToCart } = showCard();

    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(addToCart).toHaveBeenCalledWith(8, 1);
    expect(await screen.findByText("Added to cart")).toBeInTheDocument();
  });

  it("sends logged-out visitors to the login page instead", async () => {
    const user = userEvent.setup();
    const { addToCart } = showCard({ loggedIn: false });

    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(await screen.findByText("Login page")).toBeInTheDocument();
    expect(addToCart).not.toHaveBeenCalled();
  });

  it("can't be added when out of stock", () => {
    showCard({ product: { ...yogaMat, stock: 0 } });

    expect(screen.getByRole("button", { name: "Out of Stock" })).toBeDisabled();
  });

  it("shows the server's message when adding fails (e.g. not enough stock)", async () => {
    const user = userEvent.setup();
    showCard({
      addToCart: vi.fn().mockRejectedValue({ response: { data: { message: "Requested quantity exceeds available stock" } } }),
    });

    await user.click(screen.getByRole("button", { name: "Add to Cart" }));

    expect(await screen.findByText("Requested quantity exceeds available stock")).toBeInTheDocument();
  });
});
