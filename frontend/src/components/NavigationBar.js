import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import '../styles/Dashboard.css';

const NavigationBar = ({ onHamburgerClick }) => {
  const user = useSelector(state => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <nav className="navbar" style={{ background: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', height: '60px', display: 'flex', alignItems: 'center', padding: '0 24px', zIndex: 1000, position: 'relative', width: '100%' }}>
      {/* Hamburger button for mobile - always on the far left */}
      <button className="show-sidebar-btn d-md-none" style={{ fontSize: 28, background: 'none', border: 'none', color: '#333', marginRight: 20, marginLeft: 0, display: 'block', zIndex: 1100 }} onClick={onHamburgerClick}>
        <i className="bi bi-list"></i>
      </button>
      <div style={{ flex: 1 }} />
      <ul className="navbar-nav d-flex flex-row align-items-center mb-0" style={{ gap: '24px', marginBottom: 0, flexWrap: 'nowrap', minWidth: 0 }}>
        {/* Notification Dropdown */}
        <li className="nav-item dropdown position-relative" style={{ whiteSpace: 'nowrap' }}>
          <button className="btn btn-link nav-link p-0" onClick={() => setShowNotifDropdown(v => !v)} style={{ fontSize: '20px', color: '#333', position: 'relative' }}>
            <i className="bi bi-bell"></i>
            <span className="badge bg-danger rounded-pill" style={{ position: 'absolute', top: '2px', right: '-8px', fontSize: '10px', padding: '2px 5px', minWidth: '16px', textAlign: 'center' }}>5</span>
          </button>
          {showNotifDropdown && (
            <ul className="dropdown-menu dropdown-menu-end show" style={{ position: 'absolute', right: 0, top: '110%' }}>
              <li><a className="dropdown-item" href="#">New leave request</a></li>
              <li><a className="dropdown-item" href="#">Attendance alert</a></li>
              <li><a className="dropdown-item" href="#">New announcement</a></li>
            </ul>
          )}
        </li>
        {/* User Dropdown */}
        <li className="nav-item dropdown position-relative" style={{ whiteSpace: 'nowrap' }}>
          <button className="btn btn-link nav-link p-0 d-flex align-items-center" onClick={() => setShowUserDropdown(v => !v)} style={{ fontSize: '20px', color: '#333' }}>
            <i className="bi bi-person-circle me-1"></i> {user?.username || 'Manager'}
          </button>
          {showUserDropdown && (
            <ul className="dropdown-menu dropdown-menu-end show" style={{ position: 'absolute', right: 0, top: '110%' }}>
              <li><a className="dropdown-item" href="#">Profile</a></li>
              <li><a className="dropdown-item" href="#">Settings</a></li>
              <li><hr className="dropdown-divider" /></li>
              <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
            </ul>
          )}
        </li>
      </ul>
    </nav>
  );
};

export default NavigationBar; 