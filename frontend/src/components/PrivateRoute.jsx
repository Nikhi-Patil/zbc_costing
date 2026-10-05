import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../auth/auth";

function PrivateRoute() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

export default PrivateRoute;
