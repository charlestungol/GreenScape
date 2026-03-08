import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import "./index.css";
import App from "./App.jsx";
import AxiosInstance from "./components/AxiosInstance";


// Configure Axios XSRF
AxiosInstance.defaults.xsrfCookieName = "csrftoken";
AxiosInstance.defaults.xsrfHeaderName = "X-CSRFToken";
AxiosInstance.defaults.withCredentials = true;

const queryClient = new QueryClient();


  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <Router>
          <App />
        </Router>
      </QueryClientProvider>
    </StrictMode>
  );


// Ensure CSRF cookie  exists after loading frontend
AxiosInstance.get("/csrf/").catch((err) => {
  console.warn("CSRF endpoint request failed:", err);
});

