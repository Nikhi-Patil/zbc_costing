import { NavLink } from "react-router-dom";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGaugeHigh,
  faGears,
  faArrowsRotate,
  faDatabase,
  faChevronDown,
  faChevronRight,
  faUserTie,
  faBuilding,
  faUsers,
  faPuzzlePiece,
  faFlask,
  faBoxesStacked,
  faTags,
  faChartSimple,
  faHandshake,
  faChartColumn,
} from "@fortawesome/free-solid-svg-icons";

import "../../assets/css/Sidebar.css";

function Sidebar({ isOpen }) {
  const [masterOpen, setMasterOpen] = useState(false);
  const [monthlyOpen, setMonthlyOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  return (
    <aside className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
      <nav className="sidebar-nav">
        <ul className="sidebar-list">
          {/*  DASHBOARD */}
          <li>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <FontAwesomeIcon icon={faGaugeHigh} />
              <span className="sidebar-manue">Dashboard</span>
            </NavLink>
          </li>

          {/*  Molding */}
          <li>
            <NavLink
              to="/molding"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <FontAwesomeIcon icon={faGears} />
              <span className="sidebar-manue">Molding</span>
            </NavLink>
          </li>

          {/*  Molding Report */}
          <li>
            <NavLink
              to="/molding-data"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <FontAwesomeIcon icon={faGears} />
              <span className="sidebar-manue">Molding Report</span>
            </NavLink>
          </li>

          {/* Costing
          <li>
            <NavLink
              to="/costing-entry-form"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <FontAwesomeIcon icon={faGears} />
              <span>Costing</span>
            </NavLink>
          </li> */}

          {/*  Extrusion */}
          {/* <li>
            <NavLink
              to="/extrusion"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <FontAwesomeIcon icon={faArrowsRotate} />
              <span className="sidebar-manue">Extrusion</span>
            </NavLink>
          </li> */}

          {/*  BOM DETAILS */}
          <li>
            <NavLink
              to="/bop-management"
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
                    to="/monthly-master/compound"
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
                    to="/monthly-master/bop"
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
                    to="/sales-monthly"
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
                    to="/compound-polymer-monthly-report"
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
                    to="#"
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

          {/*  MASTERS */}
          <li>
            <div
              className={`menu master-menu ${masterOpen ? "active" : ""}`}
              onClick={() => setMasterOpen(!masterOpen)}
            >
              <FontAwesomeIcon icon={faDatabase} />
              <span className="sidebar-manue">Masters</span>
              <FontAwesomeIcon
                icon={masterOpen ? faChevronDown : faChevronRight}
                className="master-arrow"
              />
            </div>
            {/* MASTER SUB MENU */}
            {masterOpen && (
              <ul className="master-submenu">
                {/* Customer Master*/}
                <li>
                  <NavLink
                    to="/customer-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faUsers} />
                    <span className="sidebar-manue">Customer Master</span>
                  </NavLink>
                </li>
                {/* Part Master*/}
                <li>
                  <NavLink
                    to="/part-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faPuzzlePiece} />
                    <span className="sidebar-manue">Part Master</span>
                  </NavLink>
                </li>
                {/* Compound Master*/}
                <li>
                  <NavLink
                    to="/compound-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faFlask} />
                    <span className="sidebar-manue">Compound Master</span>
                  </NavLink>
                </li>
                {/* Bop Master*/}
                <li>
                  <NavLink
                    to="/bop-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faBoxesStacked} />
                    <span className="sidebar-manue">Bop Master</span>
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

export default Sidebar;
