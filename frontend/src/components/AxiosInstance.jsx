// AxiosInstance.js
import axios from "axios";

/**
 * NOTES:
 * - Access token is stored in localStorage under key "access".
 * - Refresh token is stored as an HttpOnly cookie by the backend (not accessible in JS).
 * - `withCredentials: true` is required so the refresh cookie is sent on /auth/refresh.
 * - CSRF cookies/headers are set so Django can validate unsafe methods (POST/PUT/PATCH/DELETE)
 *   if your refresh endpoint or other cookie-protected endpoints require CSRF.
 */

const AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000",
  withCredentials: true,
});

// CSRF config (Django defaults: csrftoken in cookie, X-CSRFToken in header)
AxiosInstance.defaults.xsrfCookieName = "csrftoken";
AxiosInstance.defaults.xsrfHeaderName = "X-CSRFToken";

/** ----------------------------------------------------------------
 * REQUEST INTERCEPTOR
 * - Attaches Authorization: Bearer <access>
 * ---------------------------------------------------------------- */
AxiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token && token !== "null" && token !== "undefined") {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // Important: keep header clean if no access token
    delete config.headers.Authorization;
  }
  return config;
});

/** ----------------------------------------------------------------
 * REFRESH LOGIC (single-flight)
 * - Ensures only one refresh request is in-flight at a time.
 * - Queues failed requests during refresh and resolves them after a new token is available.
 * ---------------------------------------------------------------- */
let isRefreshing = false;
let refreshPromise = null;
let subscribers = [];

/** Call this to subscribe to the new token once refresh completes */
const subscribeTokenRefresh = (cb) => {
  subscribers.push(cb);
};
/** Notify subscribers */
const onRefreshed = (newToken) => {
  subscribers.forEach((cb) => cb(newToken));
  subscribers = [];
};
/** Reset refresh state */
const resetRefreshState = () => {
  isRefreshing = false;
  refreshPromise = null;
  subscribers = [];
};

/** Actually call the refresh endpoint */
const performRefresh = async () => {
  // Adjust the refresh URL to your backend route
  // Common patterns:
  // - DRF SimpleJWT cookie refresh via custom endpoint, e.g. /auth/jwt/refresh/
  // - dj-rest-auth with custom cookie strategy, etc.
  // The key is: it should pull refresh token from HttpOnly cookie.
  return AxiosInstance.post("refresh/", null, {
    // Don't attach Authorization here; only the cookie is required.
    // `withCredentials: true` ensures the refresh cookie is sent.
    headers: {
      // Some backends require CSRF header even for refresh;
      // Axios already adds it because xsrfCookieName/xsrfHeaderName are set.
    },
  });
};

/** ----------------------------------------------------------------
 * RESPONSE INTERCEPTOR
 * - On 401, try refresh once, then retry the original request.
 * - Prevent infinite loops and handle concurrency safely.
 * ---------------------------------------------------------------- */
AxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // If no config or already retried, or not an axios error, just reject
    if (!original || original._retry) {
      return Promise.reject(error);
    }

    const status = error?.response?.status;
    const isNetwork = !error.response && error.message === "Network Error";

    // If it's a network error or non-401, don't try to refresh
    if (isNetwork || status !== 401) {
      return Promise.reject(error);
    }

    // If the request was to the refresh endpoint itself, or logout endpoint,
    // don't try to refresh again to avoid loops.
    const requestURL = (original?.url || "").toLowerCase();
    if (requestURL.includes("/auth/jwt/refresh") || requestURL.includes("/auth/logout")) {
      return Promise.reject(error);
    }

    // Mark this request so we only retry once
    original._retry = true;

    // If a refresh is already in progress, wait for it
    if (isRefreshing && refreshPromise) {
      try {
        const newToken = await new Promise((resolve) => {
          subscribeTokenRefresh(resolve);
        });
        // Update header and retry
        original.headers.Authorization = `Bearer ${newToken}`;
        return AxiosInstance(original);
      } catch (e) {
        // If refresh failed while we were waiting
        return Promise.reject(e);
      }
    }

    // Start refresh flow
    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const res = await performRefresh();
        // Expecting payload like: { access: "<new_jwt>" }
        const newAccess = res?.data?.access;
        if (!newAccess) {
          throw new Error("No access token returned by refresh endpoint.");
        }

        // Save and broadcast
        localStorage.setItem("access", newAccess);
        onRefreshed(newAccess);

        return newAccess;
      } catch (refreshErr) {
        // Refresh failed: clear tokens and let app handle logout
        localStorage.removeItem("access");
        onRefreshed(null); // notify waiting requests to fail fast
        // Optionally: redirect to login or emit a custom event
        // window.dispatchEvent(new Event("auth:logout"));
        throw refreshErr;
      } finally {
        resetRefreshState();
      }
    })();

    try {
      const newToken = await refreshPromise;
      if (!newToken) {
        // No token => cannot retry
        return Promise.reject(error);
      }
      // Set new header and retry original request
      original.headers.Authorization = `Bearer ${newToken}`;
      return AxiosInstance(original);
    } catch (e) {
      return Promise.reject(e);
    }
  }
);

export default AxiosInstance;