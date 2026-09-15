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
  const [reportOpen, setreportOpen] = useState(false);

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

          {/*  Molding */}
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
          <li>
            <NavLink
              to="/extrusion"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <FontAwesomeIcon icon={faArrowsRotate} />
              <span className="sidebar-manue">Extrusion</span>
            </NavLink>
          </li>

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
                {/* Employee Master*/}
                <li>
                  <NavLink
                    to="/employee-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faUserTie} />
                    <span className="sidebar-manue">Employee Master</span>
                  </NavLink>
                </li>
                {/* Unit Master*/}
                <li>
                  <NavLink
                    to="/unit-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faBuilding} />
                    <span className="sidebar-manue">Unit Master</span>
                  </NavLink>
                </li>
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
                {/* Sales Rate Master*/}
                <li>
                  <NavLink
                    to="/sales-rate-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faTags} />
                    <span className="sidebar-manue">Sales Rate Master</span>
                  </NavLink>
                </li>
                {/* Sales Qty  Master*/}
                <li>
                  <NavLink
                    to="/sales-qty-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faChartSimple} />
                    <span className="sidebar-manue">Sales Qty Master</span>
                  </NavLink>
                </li>
                {/* Vendor Master*/}
                <li>
                  <NavLink
                    to="/vendor-master"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faHandshake} />
                    <span className="sidebar-manue">Vendor Master</span>
                  </NavLink>
                </li>
              </ul>
            )}
          </li>
          {/* Report */}
          <li>
            <div
              className={`menu repot-menu ${reportOpen ? "active" : ""}`}
              onClick={() => setreportOpen(!reportOpen)}
            >
              <FontAwesomeIcon icon={faChartColumn} />
              <span className="sidebar-manue">Monthly Master</span>
              <FontAwesomeIcon
                icon={reportOpen ? faChevronDown : faChevronRight}
                className="master-arrow"
              />
            </div>
            {/* Report SUB MENU */}
            {reportOpen && (
              <ul className="master-submenu">
                {/*Montly Compound Report */}
                <li>
                  <NavLink
                    to="/monthly-master/compound"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faFlask} />
                    <span className="sidebar-manue">Montly Compound Master</span>
                  </NavLink>
                </li>
                {/* Montly Bop Report */}
                <li>
                  <NavLink
                    to="/monthly-master/bop"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faFlask} />
                    <span className="sidebar-manue">Montly Bop Master</span>
                  </NavLink>
                </li>
                {/* Montly Polymer Report */}
                <li>
                  <NavLink
                    to="/compound-polymer-monthly-report"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faFlask} />
                    <span className="sidebar-manue">Montly Polymer Report</span>
                  </NavLink>
                </li>
                {/* Montly sales Report */}
                <li>
                  <NavLink
                    to="/sales-monthly"
                    className={({ isActive }) =>
                      isActive ? "menu active" : "menu"
                    }
                  >
                    <FontAwesomeIcon icon={faFlask} className="sidebar-manue" />
                    <span className="sidebar-manue">Montly sales Report</span>
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
