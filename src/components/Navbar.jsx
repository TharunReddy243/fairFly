import React from 'react';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Plane, LogOut } from 'lucide-react';

function Navbar() {
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <Plane size={28} />
          <h1>Flight Finder</h1>
        </div>
        
        <div className="navbar-actions">
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;