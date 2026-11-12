import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach the JWT to every request automatically.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// If the server says our token is no longer valid (expired, or the secret
// changed), forget it and tell AuthContext, so the user is logged out
// cleanly instead of every request silently failing.
// Login/register 401s are just "wrong password", so they're left alone.
const AUTH_ENDPOINTS = ["/auth/login", "/auth/register"];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url || "";
    const hadToken = Boolean(error.config?.headers?.Authorization);

    if (
      status === 401 &&
      hadToken &&
      !AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint))
    ) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth:expired"));
    }

    return Promise.reject(error);
  }
);

export default api;
