import { Navigate, useLocation } from "react-router-dom";

function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
}

const EMPLOYEE_ROLES = ["employee", "admin", "supervisor", "staff"];

const RouteProtection = ({ children, allowedRole }) => {
  const location = useLocation();

  const access = localStorage.getItem("access");
  const legacyToken = localStorage.getItem("token");
  const authToken = access || legacyToken;

  const userId = localStorage.getItem("user_id");
  const storedRole =
    localStorage.getItem(`user_${userId}_role`) || localStorage.getItem("role");

  if (!authToken) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (access) {
    const payload = decodeJwt(access);
    const now = Math.floor(Date.now() / 1000);
    if (payload?.exp && payload.exp <= now) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      return <Navigate to="/" state={{ from: location, reason: "expired" }} replace />;
    }
  }

  if (allowedRole) {
    if (allowedRole === "employee") {
      if (!EMPLOYEE_ROLES.includes((storedRole || "").toLowerCase())) {
        return <Navigate to="/" replace />;
      }
    } else if (storedRole && storedRole !== allowedRole) {
      if (EMPLOYEE_ROLES.includes((storedRole || "").toLowerCase())) {
        return <Navigate to="/employee/dashboard" replace />;
      }
      if ((storedRole || "").toLowerCase() === "client") {
        return <Navigate to="/home" replace />;
      }
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default RouteProtection;