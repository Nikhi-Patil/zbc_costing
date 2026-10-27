import { NavLink } from "react-router-dom";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGaugeHigh,
  faGears,
  faChevronDown,
  faChevronRight,
  faFlask,
  faChartSimple,
  faChartColumn,
  faArrowsRotate
} from "@fortawesome/free-solid-svg-icons";

import "../../assets/css/layout/Sidebar.css";

function VPSidebar({ isOpen }) {
  const [monthlyOpen, setMonthlyOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  return (
    <aside className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
      <nav className="sidebar-nav">
        <ul className="sidebar-list">
          {/*  DASHBOARD */}
          <li>
            <NavLink
              to="/vp/dashboard"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <FontAwesomeIcon icon={faGaugeHigh} />
              <span className="sidebar-manue">Dashboard</span>
            </NavLink>
          </li>

          {/*  Molding */}
          <li>
            <NavLink
              to="/vp/molding"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <FontAwesomeIcon icon={faGears} />
              <span className="sidebar-manue">Molding - P/L</span>
            </NavLink>
          </li>

          {/*  Molding Report */}
          <li>
            <NavLink
              to="/vp/molding-data"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <FontAwesomeIcon icon={faGears} />
              <span className="sidebar-manue">Molding Report</span>
            </NavLink>
          </li>

          {/* REPORTS */}
          <li>
            <div
              className={`menu report-menu ${reportsOpen ? "active" : ""}`}
              onClick={() => setReportsOpen((prev) => !prev)}
            >
              <FontAwesomeIcon icon={faChartColumn} />

              <span className="sidebar-manue">Reports</span>

              <FontAwesomeIcon
                icon={reportsOpen ? faChevronDown : faChevronRight}
                className="master-arrow"
              />
            </div>

            {reportsOpen && (
              <ul className="master-submenu">
                {/* Monthly Polymer Report */}
                <li>
                  <NavLink
                    to="/vp/compound-polymer-monthly-report"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faFlask} />

                    <span className="sidebar-manue">
                      Monthly Polymer Report
                    </span>
                  </NavLink>
                </li>

                {/* Customer Wise Report */}
                {/* <li>
                  <NavLink
                    to="/vp/customer-report"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faFlask} />

                    <span className="sidebar-manue">Customer Wise Report</span>
                  </NavLink>
                </li> */}
              </ul>
            )}
          </li>

          {/*  Extrusion */}
          {/* <li>
            <NavLink
              to="/vp/extrusion"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <FontAwesomeIcon icon={faArrowsRotate} />
              <span className="sidebar-manue">Extrusion</span>
            </NavLink>
          </li> */}

          {/*  BOM DETAILS */}
          <li>
            <NavLink
              to="/vp/bop-management"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <FontAwesomeIcon icon={faGears} />
              <span className="sidebar-manue">BOM Details</span>
            </NavLink>
          </li>
          {/* MONTHLY MASTER */}
          <li>
            <div
              className={`menu report-menu ${monthlyOpen ? "active" : ""}`}
              onClick={() => setMonthlyOpen((prev) => !prev)}
            >
              <FontAwesomeIcon icon={faChartColumn} />

              <span className="sidebar-manue">Monthly Master</span>

              <FontAwesomeIcon
                icon={monthlyOpen ? faChevronDown : faChevronRight}
                className="master-arrow"
              />
            </div>

            {monthlyOpen && (
              <ul className="master-submenu">
                {/* Monthly Compound */}
                <li>
                  <NavLink
                    to="/vp/monthly-master/compound"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faFlask} />

                    <span className="sidebar-manue">
                      Monthly Compound Master
                    </span>
                  </NavLink>
                </li>

                {/* Monthly BOP */}
                <li>
                  <NavLink
                    to="/vp/monthly-master/bop"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faFlask} />

                    <span className="sidebar-manue">Monthly BOP Master</span>
                  </NavLink>
                </li>

                {/* Monthly Sales */}
                <li>
                  <NavLink
                    to="/vp/sales-monthly"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faChartSimple} />

                    <span className="sidebar-manue">Monthly Sales Report</span>
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default VPSidebar;
