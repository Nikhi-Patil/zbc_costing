import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./login";
import Layout from "./components/layout/Layout";
import VPLayout from "./components/layout/VpLayout";
import PrivateRoute from "./components/PrivateRoute";

// User PAGES
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
import BopMonthlyMaster from "./pages/monthly_masters/BopMonthlyMaster";
import BopMonthlyRateForm from "./pages/monthly_masters/BopMonthlyRateForm";
import BopBulkUpload from "./pages/monthly_masters/BopBulkUpload";
import CompoundMonthlyMaster from "./pages/monthly_masters/CompoundMonthlyMaster";
import CompoundMonthlyRateForm from "./pages/monthly_masters/CompoundMonthlyRateForm";
import CompoundBulkUpload from "./pages/monthly_masters/CompoundBulkUpload";
import SalesMonthly from "./pages/monthly_masters/SalesMonthly";
import SalesMonthlyEntry from "./pages/monthly_masters/SalesMonthlyEntry";
import SalesMonthlyBulk from "./pages/monthly_masters/SalesMonthlyBulk";
import CompoundPolymerMonthlyReport from "./pages/report/CompoundPolymerMonthlyReport";
import CustmorReport from "./pages/report/customerReport";

// VP PAGES
import VPDashboard from "./vp/VPDashboard";
import VPMolding from "./vp/costing/Molding";
import VPMoldingData from "./vp/costing/MoldingData";
import VPCostingWizard from "./vp/costing/CostingWizard";
import VPBopManagement from "./vp/costing/BopManagement";
import VPMoldingBulk from "./vp/costing/MoldingBulk";
import VPCompoundMaster from "./vp/masters/CompoundMaster";
import VPBopMaster from "./vp/masters/BopMaster";
import VPCustomerMaster from "./vp/masters/CustomerMaster";
import VPPartMaster from "./vp/masters/PartMaster";
import VPBopMonthlyMaster from "./vp/monthly_masters/BopMonthlyMaster";
import VPBopMonthlyRateForm from "./vp/monthly_masters/BopMonthlyRateForm";
import VPBopBulkUpload from "./vp/monthly_masters/BopBulkUpload";
import VPCompoundMonthlyMaster from "./vp/monthly_masters/CompoundMonthlyMaster";
import VPCompoundMonthlyRateForm from "./vp/monthly_masters/CompoundMonthlyRateForm";
import VPCompoundBulkUpload from "./vp/monthly_masters/CompoundBulkUpload";
import VPSalesMonthly from "./vp/monthly_masters/SalesMonthly";
import VPSalesMonthlyEntry from "./vp/monthly_masters/SalesMonthlyEntry";
import VPSalesMonthlyBulk from "./vp/monthly_masters/SalesMonthlyBulk";
import VPCompoundPolymerMonthlyReport from "./vp/report/CompoundPolymerMonthlyReport";
import VPCustmorReport from "./vp/report/customerReport";

// APP
function App() {
  return (
    <Routes>
      {/* PUBLIC LOGIN */}
      <Route path="/login" element={<Login />} />

      {/* PROTECTED APPLICATION */}
      <Route element={<PrivateRoute />}>
        <Route element={<VPLayout />}>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/vp/dashboard" element={<VPDashboard />} />

          <Route path="/vp/molding" element={<VPMolding />} />
          <Route path="/vp/molding-data" element={<VPMoldingData />} />
          <Route path="/vp/molding/bulk-upload" element={<VPMoldingBulk />} />
          <Route
            path="/vp/molding/costing-wizard"
            element={<VPCostingWizard />}
          />
          <Route
            path="/vp/molding/costing-wizard/:transactionId"
            element={<VPCostingWizard />}
          />
          <Route path="/vp/bop-management" element={<VPBopManagement />} />

          {/* MASTERS */}
          <Route path="/vp/compound-master" element={<VPCompoundMaster />} />
          <Route path="/vp/bop-master" element={<VPBopMaster />} />
          <Route path="/vp/customer-master" element={<VPCustomerMaster />} />
          <Route path="/vp/part-master" element={<VPPartMaster />} />

          {/* BOP MONTHLY MASTER */}
          <Route
            path="/vp/monthly-master/bop"
            element={<VPBopMonthlyMaster />}
          />
          <Route
            path="/vp/monthly-master/bop/add-rate"
            element={<VPBopMonthlyRateForm />}
          />
          <Route
            path="/vp/monthly-master/bop/bulk-upload"
            element={<VPBopBulkUpload />}
          />

          {/* COMPOUND MONTHLY MASTER */}
          <Route
            path="/vp/monthly-master/compound"
            element={<VPCompoundMonthlyMaster />}
          />
          <Route
            path="/vp/monthly-master/compound/add-rate"
            element={<VPCompoundMonthlyRateForm />}
          />
          <Route
            path="/vp/monthly-master/compound/bulk-upload"
            element={<VPCompoundBulkUpload />}
          />
          <Route
            path="/vp/compound-polymer-monthly-report"
            element={<VPCompoundPolymerMonthlyReport />}
          />
          <Route path="/vp/customer-report" element={<VPCustmorReport />} />

          <Route path="/vp/sales-monthly" element={<VPSalesMonthly />} />
          <Route
            path="/vp/sales-monthly/add"
            element={<VPSalesMonthlyEntry />}
          />
          <Route
            path="/vp/sales-monthly/bulk"
            element={<VPSalesMonthlyBulk />}
          />
        </Route>

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

          {/* Reports */}
          <Route
            path="/compound-polymer-monthly-report"
            element={<CompoundPolymerMonthlyReport />}
          />
          <Route path="/customer-report" element={<CustmorReport />} />

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
