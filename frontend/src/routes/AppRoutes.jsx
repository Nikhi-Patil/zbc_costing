import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Molding from "./pages/Molding";
import CostingWizard from "./pages/CostingWizard";

import VPDashboard from "./vp/VPDashboard";
import VPMolding from "./vp/VPMolding";
import VPCustomerReport from "./vp/VPCustomerReport";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Existing employee routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/molding" element={<Molding />} />
      <Route
        path="/molding/costing-wizard/:transactionId"
        element={<CostingWizard />}
      />

      {/* New VP routes */}
      <Route path="/vp/dashboard" element={<VPDashboard />} />
      <Route path="/vp/molding" element={<VPMolding />} />
      <Route
        path="/vp/customer-report"
        element={<VPCustomerReport />}
      />
    </Routes>
  );
}