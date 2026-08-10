import { useState } from "react";
import { Menu, User, LogOut, Settings } from "lucide-react";
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

      <div className="header-left">

        <button
          className="menu-btn"
          onClick={toggleSidebar}
        >
          <img src={logo} alt="Logo" className="logo" />
        </button>

       

        <h4 className="app-title">
          ZBC Costing
        </h4>

      </div>

      <div className="header-right">

        <div
          className="profile"
          onClick={() => setOpen(!open)}
        >

          <img
            src={profile}
            alt="Profile"
            className="profile-img"
          />

          <span>{user.name}</span>

        </div>

        {open && (

          <div className="dropdown">

            <div className="dropdown-item">
              <User size={18} />
              Profile
            </div>

            <div className="dropdown-item">
              <Settings size={18} />
              Settings
            </div>

            <div className="dropdown-item logout">
              <LogOut size={18} />
              Logout
            </div>

          </div>

        )}

      </div>

    </header>
  );
}

export default TopHeader;