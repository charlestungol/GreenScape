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

  // Resolve role (prefer user-specific, fall back to global)
  const userId = localStorage.getItem("user_id");
  const storedRole =
    localStorage.getItem(`user_${userId}_role`) || localStorage.getItem("role");

  // Not logged in at all → kick to landing
  if (!authToken) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If we have a JWT access token, check expiry (optional but recommended)
  if (access) {
    const payload = decodeJwt(access);
    const now = Math.floor(Date.now() / 1000);
    if (payload?.exp && payload.exp <= now) {
      // Clear tokens and redirect to landing/login
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      return (
        <Navigate
          to="/"
          state={{ from: location, reason: "expired" }}
          replace
        />
      );
    }
  }

  // If a specific role is required, enforce it
  if (allowedRole && storedRole && storedRole !== allowedRole) {
    // Redirect to a safe default per your current logic
    if (storedRole === "employee") return <Navigate to="/employeeHome" replace />;
    if (storedRole === "client") return <Navigate to="/home" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RouteProtection;
