import { useEffect, useState } from "react";
import { User, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "../../assets/css/TopHeader.css";
import logo from "../../assets/images/jayshreemain.png";
import profile from "../../assets/images/profile.jpg";
import { getUser, logout, isAuthenticated } from "../../auth/auth";

function TopHeader({ toggleSidebar }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);

  // LOAD SESSION USER
  useEffect(() => {
    const loadUser = () => {
      if (!isAuthenticated()) {
        navigate("/login", {
          replace: true,
        });
        return;
      }
      const currentUser = getUser();
      setUser(currentUser);
    };
    loadUser();
    // Check session every 10 seconds.
    const interval = setInterval(loadUser, 10000);
    return () => {
      clearInterval(interval);
    };
  }, [navigate]);

  // LOGOUT
  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate("/login", {
      replace: true,
    });
  };

  // PROFILE NAME
  const displayName = user?.user_name || user?.username || user?.email || "User";

  // RENDER
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
          <img src={profile} alt="Profile" className="profile-img" />
          <span>{displayName}</span>
        </div>

        {/* DROPDOWN */}
        {open && (
          <div className="dropdown">
            
            {/* PROFILE */}
            <div className="dropdown-item">
              <User size={18} />
              <span>Profile</span>
            </div>

            {/* SETTINGS */}
            <div className="dropdown-item">
              <Settings size={18} />
              <span>Settings</span>
            </div>

            {/* LOGOUT */}
            <div className="dropdown-item logout" onClick={handleLogout}>
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
