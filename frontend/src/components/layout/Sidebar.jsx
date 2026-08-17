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
  const [reportOpen, setreportOpen] = useState(false);

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
              <i className="fa-solid fa-gauge-high"></i>

              <span>Dashboard</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/molding"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <i className="fas fa-solid fa-gears"></i>

              <span>Molding</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/extrusion"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <i className="fas fa-solid fa-arrows-rotate"></i>

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
              <i className="fas fa-solid fa-database"></i>

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
                <li>
                  <NavLink
                    to="/employee-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fa-solid fa-user-tie"></i>

                    <span>Employee Master</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/unit-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fa-solid fa-building"></i>

                    <span>Unit Master</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/customer-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fa-solid fa-users"></i>

                    <span>Customer Master</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/part-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fa-solid fa-puzzle-piece"></i>

                    <span>Part Master</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/compound-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fa-solid fa-flask"></i>

                    <span>Compound Master</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/bop-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fa-solid fa-boxes-stacked"></i>

                    <span>Bop Master</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/sales-rate-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fa-solid fa-tags"></i>

                    <span>Sales Rate Master</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/sales-qty-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fa-solid fa-chart-simple"></i>

                    <span>Sales Qty Master</span>
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/vendor-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fa-solid fa-handshake"></i>

                    <span>Vendor Master</span>
                  </NavLink>
                </li>

                <li>
                  <NavLink
                    to="/montly-compound-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <i className="fa-solid fa-flask"></i>

                    <span>Montly Compound Master</span>
                  </NavLink>
                </li>
              </ul>
            )}
          </li>

          {/* =========================
                        TRANSACTIONS
                    ========================= */}

          <li>
            <div
              className={`menu repot-menu ${reportOpen ? "active" : ""}`}
              onClick={() => setreportOpen(!reportOpen)}
            >
              <i className="fa-solid fa-chart-column"></i>

              <span>Report</span>

              <i
                className={`fas ${
                  masterOpen ? "fa-chevron-down" : "fa-chevron-right"
                } master-arrow`}
              ></i>
            </div>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
