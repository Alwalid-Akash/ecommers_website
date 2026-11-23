// The shared HTTP client: adds the login token to requests, and logs the
// user out when the server says the token is no longer valid.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosError } from "axios";
import api from "../src/services/api";

// Replace the network with a fake server that answers with `status`.
let lastRequest;
function fakeServer(status, data = {}) {
  api.defaults.adapter = async (config) => {
    lastRequest = config;
    const response = { status, data, headers: {}, config, statusText: "" };
    if (status >= 400) {
      throw new AxiosError(`HTTP ${status}`, "ERR_BAD_RESPONSE", config, null, response);
    }
    return response;
  };
}

let expiredListener;
beforeEach(() => {
  lastRequest = undefined;
  expiredListener = vi.fn();
  window.addEventListener("auth:expired", expiredListener);
  return () => window.removeEventListener("auth:expired", expiredListener);
});

describe("api (axios client)", () => {
  it("adds the saved token as 'Authorization: Bearer …'", async () => {
    localStorage.setItem("token", "abc123");
    fakeServer(200);

    await api.get("/cart");

    expect(lastRequest.headers.Authorization).toBe("Bearer abc123");
  });

  it("sends no Authorization header when logged out", async () => {
    fakeServer(200);

    await api.get("/products");

    expect(lastRequest.headers.Authorization).toBeUndefined();
  });

  it("a 401 on a normal request means the token expired → remove it and tell the app", async () => {
    localStorage.setItem("token", "old-token");
    fakeServer(401);

    await expect(api.get("/cart")).rejects.toBeInstanceOf(AxiosError);

    expect(localStorage.getItem("token")).toBeNull();
    expect(expiredListener).toHaveBeenCalledTimes(1);
  });

  it("a 401 on login just means a wrong password → stay as you are", async () => {
    localStorage.setItem("token", "keep-me");
    fakeServer(401, { message: "Invalid email or password" });

    await expect(api.post("/auth/login", {})).rejects.toBeInstanceOf(AxiosError);

    expect(localStorage.getItem("token")).toBe("keep-me");
    expect(expiredListener).not.toHaveBeenCalled();
  });

  it("other errors (e.g. 500) don't log the user out", async () => {
    localStorage.setItem("token", "keep-me");
    fakeServer(500);

    await expect(api.get("/orders")).rejects.toBeInstanceOf(AxiosError);

    expect(localStorage.getItem("token")).toBe("keep-me");
    expect(expiredListener).not.toHaveBeenCalled();
  });
});
