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

  const isVPAdmin = ["super admin", "admin", "vp", "vice president"].includes(
    designation,
  );

  const isVPRoute = location.pathname.startsWith("/vp/");

  // Super Admin, Admin, and Vice President use VP pages.
  if (isVPAdmin && !isVPRoute) {
    return <Navigate to="/vp/dashboard" replace />;
  }

  // Regular users cannot access VP pages.
  if (!isVPAdmin && isVPRoute) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default PrivateRoute;
