import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./index.css";
import App from "./App.jsx";
import AxiosInstance from "./components/AxiosInstance";

// Ensure CSRF cookie is fetched and header is set before the app renders.
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp('(^|; )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};

const queryClient = new QueryClient();

// Async bootstrap: request /csrf/ to ensure server sets csrftoken cookie,
// then configure Axios defaults and render the app.
(async () => {
  try {
    await AxiosInstance.get('/csrf/');
  } catch (err) {
    // ignore; even if this fails, we still attempt to read cookies below
    console.warn('CSRF endpoint request failed:', err);
  }

  const csrftoken = getCookie('csrftoken') || getCookie('csrf');
  if (csrftoken) {
    AxiosInstance.defaults.headers.common['X-CSRFToken'] = csrftoken;
  }

  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Router>
          <App />
        </Router>
      </QueryClientProvider>
    </StrictMode>
  );
})();
