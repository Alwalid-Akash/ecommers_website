// Who can see which pages: logged-out users, customers and admins.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "../src/components/ProtectedRoute";
import AdminRoute from "../src/components/AdminRoute";
import { useAuth } from "../src/context/AuthContext";

vi.mock("../src/context/AuthContext", () => ({ useAuth: vi.fn() }));

const loggedOut = { loading: false, isAuthenticated: false, user: null };
const customer = { loading: false, isAuthenticated: true, user: { name: "Ali", role: "customer" } };
const admin = { loading: false, isAuthenticated: true, user: { name: "Boss", role: "admin" } };
const stillChecking = { loading: true, isAuthenticated: false, user: null };

// Opens the app at `path` with a tiny set of pages.
function openPage(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>Home page</p>} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/orders" element={<ProtectedRoute><p>My orders</p></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><p>Admin dashboard</p></AdminRoute>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("ProtectedRoute (pages for logged-in users)", () => {
  it("sends logged-out users to the login page", () => {
    useAuth.mockReturnValue(loggedOut);
    openPage("/orders");
    expect(screen.getByText("Login page")).toBeInTheDocument();
    expect(screen.queryByText("My orders")).not.toBeInTheDocument();
  });

  it("shows the page to logged-in users", () => {
    useAuth.mockReturnValue(customer);
    openPage("/orders");
    expect(screen.getByText("My orders")).toBeInTheDocument();
  });

  it("waits while the login is still being checked (no wrong redirect on refresh)", () => {
    useAuth.mockReturnValue(stillChecking);
    openPage("/orders");
    expect(screen.getByText("Checking authentication...")).toBeInTheDocument();
    expect(screen.queryByText("Login page")).not.toBeInTheDocument();
  });
});

describe("AdminRoute (admin pages)", () => {
  it("sends logged-out users to the login page", () => {
    useAuth.mockReturnValue(loggedOut);
    openPage("/admin");
    expect(screen.getByText("Login page")).toBeInTheDocument();
  });

  it("sends customers back to the home page", () => {
    useAuth.mockReturnValue(customer);
    openPage("/admin");
    expect(screen.getByText("Home page")).toBeInTheDocument();
    expect(screen.queryByText("Admin dashboard")).not.toBeInTheDocument();
  });

  it("shows the admin page to admins", () => {
    useAuth.mockReturnValue(admin);
    openPage("/admin");
    expect(screen.getByText("Admin dashboard")).toBeInTheDocument();
  });

  it("waits while the login is still being checked", () => {
    useAuth.mockReturnValue(stillChecking);
    openPage("/admin");
    expect(screen.getByText("Checking authentication...")).toBeInTheDocument();
  });
});
