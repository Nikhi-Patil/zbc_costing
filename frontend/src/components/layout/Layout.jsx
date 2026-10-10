import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import TopHeader from "./Topheader";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import "../../assets/css/layout/Layout.css";

function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <Header title="ZBC Costing" />
      <div className="layout">
        <TopHeader toggleSidebar={toggleSidebar} />
        <Sidebar isOpen={isSidebarOpen} />
        <div
          className={`main-content ${
            isSidebarOpen ? "sidebar-open" : "sidebar-close"
          }`}
        >
          <div className="page-content">
            <Outlet />
          </div>
          <Footer />
        </div>
      </div>
    </>
  );
}

export default Layout;
