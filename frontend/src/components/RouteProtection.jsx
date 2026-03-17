import { Navigate, useLocation } from "react-router-dom";

/** Optional: decode JWT payload to check expiry */
function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

const RouteProtection = ({ children, allowedRole }) => {
  const location = useLocation();

  // Support both SimpleJWT (access) and legacy token for transition period
  const access = localStorage.getItem("access");
  const legacyToken = localStorage.getItem("token");
  const authToken = access || legacyToken;

  // Resolve role
  const userId = localStorage.getItem("user_id");
  const storedRole =
    localStorage.getItem(`user_${userId}_role`) || localStorage.getItem("role");

  // Not logged in → back to landing
  if (!authToken) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If JWT exists, check expiry
  if (access) {
    const payload = decodeJwt(access);
    const now = Math.floor(Date.now() / 1000);

    if (payload?.exp && payload.exp <= now) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      localStorage.removeItem("role");
      localStorage.removeItem("user_id");
      localStorage.removeItem("employee_id");
      localStorage.removeItem("employee_number");
      localStorage.removeItem("email");
      localStorage.removeItem("first_name");
      localStorage.removeItem("last_name");

      return (
        <Navigate
          to="/"
          state={{ from: location, reason: "expired" }}
          replace
        />
      );
    }
  }

  // Role protection
  if (allowedRole && storedRole && storedRole !== allowedRole) {
    if (storedRole === "employee") {
      return <Navigate to="/employee/dashboard" replace />;
    }

    if (storedRole === "client") {
      return <Navigate to="/home" replace />;
    }

    return <Navigate to="/" replace />;
  }

  return children;
};

export default RouteProtection;