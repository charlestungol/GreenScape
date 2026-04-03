import { Navigate, useLocation } from "react-router-dom";

/**
 * Decode JWT payload to check expiration.
 * Safe: returns null if token is malformed.
 */
function decodeJwt(token) {
  try {
    const [, payload] = token.split(".");
    return JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    );
  } catch {
    return null;
  }
}

const RouteProtection = ({ children, allowedRole }) => {
  const location = useLocation();

  const access = localStorage.getItem("access");
  const legacyToken = localStorage.getItem("token");
  const authToken = access || legacyToken;

  const storedRole = localStorage.getItem("role");
  const roleLower = (storedRole || "").toLowerCase();

  /* =====================================================
     AUTHENTICATION CHECK
     ===================================================== */
  if (!authToken) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  /* =====================================================
     TOKEN EXPIRATION CHECK
     ===================================================== */
  if (access) {
    const payload = decodeJwt(access);
    const now = Math.floor(Date.now() / 1000);

    if (payload?.exp && payload.exp <= now) {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      return <Navigate to="/" replace />;
    }
  }

  /* =====================================================
     ROLE-BASED ROUTING
     ===================================================== */

  /**
   * EMPLOYEE ROUTES*/
  if (allowedRole === "employee") {
    if (roleLower === "client") {
      console.log(
        "RouteProtection: Blocking client access to employee route"
      );
      return <Navigate to="/" replace />;
    }
  }

  /**
   * CLIENT ROUTES */
  if (allowedRole === "client") {
    if (roleLower && roleLower !== "client") {
      console.log(
        "RouteProtection: Blocking employee access to client route"
      );
      return <Navigate to="/employeeHome" replace />;
    }
  }

  /* =====================================================
     ACCESS GRANTED
     ===================================================== */
  return children;
};

export default RouteProtection;