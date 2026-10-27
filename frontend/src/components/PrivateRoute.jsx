import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAuthenticated } from "../auth/auth";

function PrivateRoute() {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  const storedUser = localStorage.getItem("user");

  let user = {};

  try {
    user = storedUser ? JSON.parse(storedUser) : {};
  } catch {
    user = {};
  }

  const designation = String(user.designation ?? user.designation_name ?? "")
    .trim()
    .toLowerCase();

  const isVPAdmin = ["vp", "admin"].includes(designation);
  const isVPRoute = location.pathname.startsWith("/vp/");

  // VP and Admin use the same dedicated section.
  if (isVPAdmin && !isVPRoute) {
    return <Navigate to="/vp/dashboard" replace />;
  }

  // Normal users cannot access VP/Admin pages.
  if (!isVPAdmin && isVPRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default PrivateRoute;
