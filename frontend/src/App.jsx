import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Layout from "./components/layout/Layout";
import Molding from "./pages/costing/Molding";
import Dashboard from "./pages/Dashboard";
import CostingWizard from "./pages/costing/CostingWizard";
import UnitMaster from "./pages/masters/UnitMaster";
import CompoundMaster from "./pages/masters/CompoundMaster";
import BopMaster from "./pages/masters/BopMaster";
import CustomerMaster from "./pages/masters/CustomerMaster";
import EmployeeMaster from "./pages/masters/EmployeeMaster";
import PartMaster from "./pages/masters/PartMaster";
import SalesRateMaster from "./pages/masters/SalesRateMaster";
import SalesQtyMaster from "./pages/masters/SalesQtyMaster";
import VenderMaster from "./pages/masters/VenderMaster";
import SupplierMaster from "./pages/masters/SupplierMaster";
import CompoundPolymerMonthlyReport from "./pages/monthly_masters/CompoundPolymerMonthlyReport";
import BopMonthlyMaster from "./pages/monthly_masters/BopMonthlyMaster";
import BopMonthlyRateForm from "./pages/monthly_masters/BopMonthlyRateForm";
import BopBulkUpload from "./pages/monthly_masters/BopBulkUpload";
import CompoundMonthlyMaster from "./pages/monthly_masters/CompoundMonthlyMaster";
import CompoundMonthlyRateForm from "./pages/monthly_masters/CompoundMonthlyRateForm";
import CompoundBulkUpload from "./pages/monthly_masters/CompoundBulkUpload";

import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Layout>
      <Routes>
        {/* Existing Monthly Masters */}
        <Route path="/monthly-bop-master" element={<Navigate to="/monthly-master/bop" replace />}/>
        <Route path="/monthly-compound-master" element={<Navigate to="/monthly-master/compound" replace />}/>
        <Route path="/compound-polymer-monthly-report" element={<CompoundPolymerMonthlyReport />}/>

        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Costing */}
        <Route path="/molding/costing-wizard" element={<CostingWizard />} />
        <Route path="/molding/costing-wizard/:transactionId" element={<CostingWizard />}/>

        {/* Masters */}
        <Route path="/unit-master" element={<UnitMaster />} />
        <Route path="/compound-master" element={<CompoundMaster />} />
        <Route path="/bop-master" element={<BopMaster />} />
        <Route path="/customer-master" element={<CustomerMaster />} />
        <Route path="/employee-master" element={<EmployeeMaster />} />
        <Route path="/part-master" element={<PartMaster />} />
        <Route path="/sales-rate-master" element={<SalesRateMaster />} />
        <Route path="/sales-qty-master" element={<SalesQtyMaster />} />
        <Route path="/vender-master" element={<VenderMaster />} />
        <Route path="/supplier-master" element={<SupplierMaster />} />

        <Route path="/molding" element={<Molding />} />

        {/* BOP MONTHLY MASTER */}
        <Route path="/monthly-master/bop" element={<BopMonthlyMaster />} />
        <Route path="/monthly-master/bop/add-rate" element={<BopMonthlyRateForm />}/>
        <Route path="/monthly-master/bop/bulk-upload" element={<BopBulkUpload />}/>

        {/* COMPOUND MONTHLY MASTER */}
        <Route path="/monthly-master/compound" element={<CompoundMonthlyMaster />}/>
        <Route path="/monthly-master/compound/add-rate" element={<CompoundMonthlyRateForm />}/>
        <Route path="/monthly-master/compound/bulk-upload" element={<CompoundBulkUpload />}/>
      </Routes>
    </Layout>
  );
}

export default App;
