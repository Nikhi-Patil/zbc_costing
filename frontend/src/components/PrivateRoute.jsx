import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../auth/auth";

const PrivateRoute = () => {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;
