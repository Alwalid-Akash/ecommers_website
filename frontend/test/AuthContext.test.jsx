// Login state: logging in/out, staying logged in after a refresh,
// and being logged out when the token expires.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import api from "../src/services/api";
import { AuthProvider, useAuth } from "../src/context/AuthContext";

vi.mock("../src/services/api", () => ({ default: { get: vi.fn(), post: vi.fn() } }));

// A small component that shows the login state and has login/logout buttons.
function Probe() {
  const { user, loading, isAuthenticated, login, logout } = useAuth();
  if (loading) return <p>loading</p>;
  return (
    <div>
      <p>{isAuthenticated ? `Hello ${user.name}` : "Logged out"}</p>
      <button onClick={() => login("ali@test.com", "secret123").catch(() => {})}>login</button>
      <button onClick={logout}>logout</button>
    </div>
  );
}

const renderAuth = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>
  );

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {}); // hide expected error logs
});

describe("AuthContext", () => {
  it("starts logged out when there is no saved token", async () => {
    renderAuth();
    expect(await screen.findByText("Logged out")).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  it("stays logged in after a page refresh if the saved token is still valid", async () => {
    localStorage.setItem("token", "valid-token");
    api.get.mockResolvedValue({ data: { user: { name: "Ali" } } });

    renderAuth();

    expect(await screen.findByText("Hello Ali")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/auth/me");
  });

  it("removes a saved token that the server rejects", async () => {
    localStorage.setItem("token", "expired-token");
    api.get.mockRejectedValue(new Error("401"));

    renderAuth();

    expect(await screen.findByText("Logged out")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("login sends the credentials, saves the token and sets the user", async () => {
    api.post.mockResolvedValue({ data: { token: "new-token", user: { name: "Ali" } } });
    const user = userEvent.setup();
    renderAuth();

    await user.click(await screen.findByRole("button", { name: "login" }));

    expect(await screen.findByText("Hello Ali")).toBeInTheDocument();
    expect(api.post).toHaveBeenCalledWith("/auth/login", { email: "ali@test.com", password: "secret123" });
    expect(localStorage.getItem("token")).toBe("new-token");
  });

  it("logout removes the token and the user", async () => {
    localStorage.setItem("token", "valid-token");
    api.get.mockResolvedValue({ data: { user: { name: "Ali" } } });
    const user = userEvent.setup();
    renderAuth();
    await screen.findByText("Hello Ali");

    await user.click(screen.getByRole("button", { name: "logout" }));

    expect(screen.getByText("Logged out")).toBeInTheDocument();
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("logs the user out when the token expires during a visit (auth:expired event)", async () => {
    localStorage.setItem("token", "valid-token");
    api.get.mockResolvedValue({ data: { user: { name: "Ali" } } });
    renderAuth();
    await screen.findByText("Hello Ali");

    act(() => {
      window.dispatchEvent(new Event("auth:expired")); // what api.js sends on a 401
    });

    expect(screen.getByText("Logged out")).toBeInTheDocument();
  });
});
