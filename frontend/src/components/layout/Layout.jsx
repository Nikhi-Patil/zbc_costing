import { useState } from "react";

import Header from "./Header";
import TopHeader from "./Topheader";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

import "../../assets/css/Layout.css";

function Layout({ children }) {
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
            {children}
          </div>

          <Footer />
        </div>

      </div>
    </>
  );
}

export default Layout;