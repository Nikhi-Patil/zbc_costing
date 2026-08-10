import { NavLink } from "react-router-dom";
import { useState } from "react";

import {
  LayoutDashboard,
  Users,
  Factory,
  Globe,
  Building2,
  FileText,
  Calculator,
} from "lucide-react";

import "../../assets/css/Sidebar.css";

function Sidebar({ isOpen }) {
  const [masterOpen, setMasterOpen] = useState(false);

  return (
    <aside className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
      <nav className="sidebar-nav">
        <ul className="sidebar-list">
          {/* =========================
                        DASHBOARD
                    ========================= */}

          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <i className="fas fa-tachometer-alt"></i>

              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <i className="fas fa-tachometer-alt"></i>

              <span>Molding</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <i className="fas fa-tachometer-alt"></i>

              <span>Extrusion</span>
            </NavLink>
          </li>

          {/* =========================
                        MASTERS
                    ========================= */}

          <li>
            <div
              className={`menu master-menu ${masterOpen ? "active" : ""}`}
              onClick={() => setMasterOpen(!masterOpen)}
            >
              <i className="fas fa-database"></i>

              <span>Masters</span>

              <i
                className={`fas ${
                  masterOpen ? "fa-chevron-down" : "fa-chevron-right"
                } master-arrow`}
              ></i>
            </div>

            {/* =========================
                            MASTER SUB MENU
                        ========================= */}

            {masterOpen && (
              <ul className="master-submenu">
                {/* Plant */}
                <li>
                  <NavLink
                    to="/plant-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fas fa-industry"></i>

                    <span>Employee Master</span>
                  </NavLink>
                </li>

                {/* Employee */}
                <li>
                  <NavLink
                    to="/employee-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fas fa-users"></i>

                    <span>Customer Master</span>
                  </NavLink>
                </li>

                {/* Customer */}
                <li>
                  <NavLink
                    to="/customer-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fas fa-user-tie"></i>

                    <span>Part Master</span>
                  </NavLink>
                </li>

                {/* Supplier */}
                <li>
                  <NavLink
                    to="/supplier-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fas fa-truck"></i>

                    <span>Compound Master</span>
                  </NavLink>
                </li>

                {/* Unit */}
                <li>
                  <NavLink
                    to="/unit-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fas fa-building"></i>

                    <span>Bop Master</span>
                  </NavLink>
                </li>

                {/* Department */}
                <li>
                  <NavLink
                    to="/department-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fas fa-sitemap"></i>

                    <span>Sales Rate Master</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/department-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fas fa-sitemap"></i>

                    <span>Sales Qty Master</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/department-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fas fa-sitemap"></i>

                    <span>Vendor Master</span>
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* =========================
                        TRANSACTIONS
                    ========================= */}

          <li>
            <div className="menu">
              <i className="fas fa-exchange-alt"></i>

              <span>Report</span>
            </div>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
