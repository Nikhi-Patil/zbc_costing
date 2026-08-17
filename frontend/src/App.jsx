import {BrowserRouter, Routes, Route } from "react-router-dom";

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
import CompoundMonthlyReport from "./pages/monthly_masters/CompoundMonthlyReport";
import PrivateRoute from "./components/PrivateRoute";

function App() {
  return (
    <Layout>
       <Routes>

        {/* Public
        <Route path="/login" element={<Login />} />
      
      <Routes element={<PrivateRoute />}> */}
        <Route path="/montly-compound-master" element={<CompoundMonthlyReport/>}/>
        
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/molding/costing-wizard" element={<CostingWizard />} />

        <Route path="/molding/costing-wizard/:transactionId" element={<CostingWizard />}/>
        
        <Route path="/unit-master" element= {<UnitMaster />} />

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
      </Routes>
    </Layout>
  );
}

export default App;
