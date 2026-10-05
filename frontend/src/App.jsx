import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/login";

import Layout from "./components/layout/Layout";
import PrivateRoute from "./components/PrivateRoute";

// ============================================================
// PAGES
// ============================================================

import Dashboard from "./pages/Dashboard";

import Molding from "./pages/costing/Molding";
import CostingWizard from "./pages/costing/CostingWizard";
import CostingEntryForm from "./pages/costing/CostingEntryForm";
import BopManagement from "./pages/costing/BopManagement";
import MoldingData from "./pages/costing/MoldingData";
import MoldingBulk from "./pages/costing/MoldingBulk";

import CompoundMaster from "./pages/masters/CompoundMaster";
import BopMaster from "./pages/masters/BopMaster";
import CustomerMaster from "./pages/masters/CustomerMaster";
import PartMaster from "./pages/masters/PartMaster";

import CompoundPolymerMonthlyReport from "./pages/monthly_masters/CompoundPolymerMonthlyReport";
import BopMonthlyMaster from "./pages/monthly_masters/BopMonthlyMaster";
import BopMonthlyRateForm from "./pages/monthly_masters/BopMonthlyRateForm";
import BopBulkUpload from "./pages/monthly_masters/BopBulkUpload";

import CompoundMonthlyMaster from "./pages/monthly_masters/CompoundMonthlyMaster";
import CompoundMonthlyRateForm from "./pages/monthly_masters/CompoundMonthlyRateForm";
import CompoundBulkUpload from "./pages/monthly_masters/CompoundBulkUpload";

import SalesMonthly from "./pages/monthly_masters/SalesMonthly";
import SalesMonthlyEntry from "./pages/monthly_masters/SalesMonthlyEntry";
import SalesMonthlyBulk from "./pages/monthly_masters/SalesMonthlyBulk";

// APP
function App() {
  return (
    <Routes>
      {/* PUBLIC LOGIN */}
      <Route path="/login" element={<Login />} />

      {/* PROTECTED APPLICATION */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          {/* DEFAULT */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* DASHBOARD */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* COSTING */}
          <Route path="/molding" element={<Molding />} />
          <Route path="/molding-data" element={<MoldingData />} />
          <Route path="/molding/bulk-upload" element={<MoldingBulk />} />
          <Route path="/molding/costing-wizard" element={<CostingWizard />} />
          <Route
            path="/molding/costing-wizard/:transactionId"
            element={<CostingWizard />}
          />
          <Route path="/costing-entry-form" element={<CostingEntryForm />} />
          <Route path="/bop-management" element={<BopManagement />} />

          {/* MASTERS */}
          <Route path="/compound-master" element={<CompoundMaster />} />
          <Route path="/bop-master" element={<BopMaster />} />
          <Route path="/customer-master" element={<CustomerMaster />} />
          <Route path="/part-master" element={<PartMaster />} />
          
          {/* BOP MONTHLY MASTER */}
          <Route path="/monthly-master/bop" element={<BopMonthlyMaster />} />
          <Route
            path="/monthly-master/bop/add-rate"
            element={<BopMonthlyRateForm />}
          />
          <Route
            path="/monthly-master/bop/bulk-upload"
            element={<BopBulkUpload />}
          />

          {/* COMPOUND MONTHLY MASTER */}
          <Route
            path="/monthly-master/compound"
            element={<CompoundMonthlyMaster />}
          />
          <Route
            path="/monthly-master/compound/add-rate"
            element={<CompoundMonthlyRateForm />}
          />

          <Route
            path="/monthly-master/compound/bulk-upload"
            element={<CompoundBulkUpload />}
          />

          <Route
            path="/compound-polymer-monthly-report"
            element={<CompoundPolymerMonthlyReport />}
          />

          {/* SALES MONTHLY */}
          <Route path="/sales-monthly" element={<SalesMonthly />} />
          <Route path="/sales-monthly/add" element={<SalesMonthlyEntry />} />
          <Route path="/sales-monthly/bulk" element={<SalesMonthlyBulk />} />
        </Route>
      </Route>

      {/* UNKNOWN URL */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
