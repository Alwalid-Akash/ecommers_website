// The login form: success, wrong password, and the "logging in" state.
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import Login from "../src/pages/Login";
import { useAuth } from "../src/context/AuthContext";

vi.mock("../src/context/AuthContext", () => ({ useAuth: vi.fn() }));

function openLogin(login) {
  useAuth.mockReturnValue({ login });
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<p>Home page</p>} />
      </Routes>
    </MemoryRouter>
  );
}

async function fillAndSubmit(user, email, password) {
  await user.type(screen.getByLabelText("Email"), email);
  await user.type(screen.getByLabelText("Password"), password);
  await user.click(screen.getByRole("button", { name: "Login" }));
}

describe("Login page", () => {
  it("logs in with the typed email and password, then goes to the home page", async () => {
    const login = vi.fn().mockResolvedValue({});
    const user = userEvent.setup();
    openLogin(login);

    await fillAndSubmit(user, "ali@test.com", "secret123");

    expect(login).toHaveBeenCalledWith("ali@test.com", "secret123");
    expect(await screen.findByText("Home page")).toBeInTheDocument();
  });

  it("shows the server's message when the password is wrong, and stays on the page", async () => {
    const login = vi.fn().mockRejectedValue({ response: { data: { message: "Invalid email or password" } } });
    const user = userEvent.setup();
    openLogin(login);

    await fillAndSubmit(user, "ali@test.com", "wrong");

    expect(await screen.findByText("Invalid email or password")).toBeInTheDocument();
    expect(screen.queryByText("Home page")).not.toBeInTheDocument();
  });

  it("disables the button while logging in (no double submits)", async () => {
    let finish;
    const login = vi.fn(() => new Promise((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    openLogin(login);

    await fillAndSubmit(user, "ali@test.com", "secret123");

    expect(screen.getByRole("button", { name: "Logging in..." })).toBeDisabled();
    finish({});
    expect(await screen.findByText("Home page")).toBeInTheDocument();
  });
});
