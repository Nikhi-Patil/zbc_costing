import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import {
  faGaugeHigh,
  faGears,
  faDatabase,
  faChevronDown,
  faChevronRight,
  faUsers,
  faPuzzlePiece,
  faFlask,
  faBoxesStacked,
  faChartSimple,
  faChartColumn,
} from "@fortawesome/free-solid-svg-icons";

import "../../assets/css/layout/Sidebar.css";

function VPSidebar({ isOpen }) {
  const [openMenu, setOpenMenu] = useState(null);
  const sidebarRef = useRef(null);

  // Open one branch at a time
  const toggleMenu = (menuName) => {
    setOpenMenu((current) => (current === menuName ? null : menuName));
  };

  // Close all expanded menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Reusable expandable branch
  const renderBranch = (menuName, label, icon, children) => (
    <li key={menuName}>
      <div
        className={`menu report-menu ${openMenu === menuName ? "active" : ""}`}
        onClick={() => toggleMenu(menuName)}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleMenu(menuName);
          }
        }}
      >
        <FontAwesomeIcon icon={icon} />

        <span className="sidebar-manue">{label}</span>

        <FontAwesomeIcon
          icon={openMenu === menuName ? faChevronDown : faChevronRight}
          className="master-arrow"
        />
      </div>

      {openMenu === menuName && <ul className="master-submenu">{children}</ul>}
    </li>
  );

  // Reusable VP submenu link
  const childLink = (to, icon, label) => (
    <li key={to}>
      <NavLink
        to={to}
        className={({ isActive }) => (isActive ? "menu active" : "menu")}
      >
        <FontAwesomeIcon icon={icon} />
        <span className="sidebar-manue">{label}</span>
      </NavLink>
    </li>
  );

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${isOpen ? "open" : "collapsed"}`}
    >
      {/* MAIN NAVIGATION */}
      <nav className="sidebar-nav">
        <ul className="sidebar-list">
          {/* Dashboard */}
          <li>
            <NavLink
              to="/vp/dashboard"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <FontAwesomeIcon icon={faGaugeHigh} />
              <span className="sidebar-manue">Dashboard</span>
            </NavLink>
          </li>

          {/* Molding P/L */}
          <li>
            <NavLink
              to="/vp/molding"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <FontAwesomeIcon icon={faGears} />
              <span className="sidebar-manue">Molding - P/L</span>
            </NavLink>
          </li>

          {/* Molding Report */}
          <li>
            <NavLink
              to="/vp/molding-data"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <FontAwesomeIcon icon={faGears} />
              <span className="sidebar-manue">Molding Report</span>
            </NavLink>
          </li>

          {/* Reports */}
          {renderBranch(
            "reports",
            "Reports",
            faChartColumn,
            <>
              {childLink(
                "/vp/compound-polymer-monthly-report",
                faFlask,
                "Monthly Polymer Report",
              )}

              {/* Add other VP report links here if required */}
            </>,
          )}

          {/* BOM Details */}
          <li>
            <NavLink
              to="/vp/bop-management"
              className={({ isActive }) => (isActive ? "menu active" : "menu")}
            >
              <FontAwesomeIcon icon={faGears} />
              <span className="sidebar-manue">BOM Details</span>
            </NavLink>
          </li>

          {/* Monthly Master */}
          {renderBranch(
            "monthly",
            "Monthly Master",
            faChartColumn,
            <>
              {childLink(
                "/vp/monthly-master/compound",
                faFlask,
                "Monthly Compound Master",
              )}

              {childLink(
                "/vp/monthly-master/bop",
                faFlask,
                "Monthly BOP Master",
              )}

              {childLink(
                "/vp/sales-monthly",
                faChartSimple,
                "Monthly Sales Report",
              )}
            </>,
          )}
        </ul>
      </nav>

      {/* MASTERS AT THE BOTTOM */}
      <div className="sidebar-bottom">
        <div
          className={`menu master-menu ${
            openMenu === "masters" ? "active" : ""
          }`}
          onClick={() => toggleMenu("masters")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleMenu("masters");
            }
          }}
        >
          <FontAwesomeIcon icon={faDatabase} />

          <span className="sidebar-manue">Masters</span>

          <FontAwesomeIcon
            icon={openMenu === "masters" ? faChevronDown : faChevronRight}
            className="master-arrow"
          />
        </div>

        {openMenu === "masters" && (
          <ul className="master-submenu master-submenu-up">
            {childLink("/vp/customer-master", faUsers, "Customer Master")}

            {childLink("/vp/part-master", faPuzzlePiece, "Part Master")}

            {childLink("/vp/compound-master", faFlask, "Compound Master")}

            {childLink("/vp/bop-master", faBoxesStacked, "BOP Master")}
          </ul>
        )}
      </div>
    </aside>
  );
}

export default VPSidebar;
