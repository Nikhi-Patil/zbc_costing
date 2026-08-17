import { useState } from "react";
import { User, LogOut, Settings } from "lucide-react";

import "../../assets/css/TopHeader.css";

import logo from "../../assets/images/jayshreemain.png";
import profile from "../../assets/images/profile.jpg";

function TopHeader({ toggleSidebar }) {
  const [open, setOpen] = useState(false);

  const user = {
    name: "Admin",
    image: profile,
  };

  return (
    <header className="top-header">
      {/* LEFT SIDE */}
      <div className="header-left">
        <button className="menu-btn" onClick={toggleSidebar} type="button">
          <img src={logo} alt="Logo" className="logo" />
        </button>

        <h4 className="app-title">ZBC Costing</h4>
      </div>

      {/* RIGHT SIDE */}
      <div className="header-right">
        <div className="profile" onClick={() => setOpen((prev) => !prev)}>
          <img src={user.image} alt="Profile" className="profile-img" />

          <span>{user.name}</span>
        </div>

        {/* DROPDOWN */}

        {open && (
          <div className="dropdown">
            <div className="dropdown-item">
              <User size={18} />
              <span>Profile</span>
            </div>

            <div className="dropdown-item">
              <Settings size={18} />
              <span>Settings</span>
            </div>

            <div className="dropdown-item logout">
              <LogOut size={18} />
              <span>Logout</span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

export default TopHeader;
