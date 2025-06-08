import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import '../styles/Dashboard.css';
import { Link } from 'react-router-dom';

const Sidebar = ({ showSidebar, onCloseSidebar }) => {
  const user = useSelector(state => state.auth.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const isPIC = user?.role === 'PIC';

  const handleNavigation = (path) => {
    navigate(path);
    if (window.innerWidth <= 768 && onCloseSidebar) onCloseSidebar();
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className={`sidebar${showSidebar ? ' active' : ''}`}>
      <div className="sidebar-header">
        <h4 className="mb-0 text-white"><span>HRMS</span> CME</h4>
      </div>
      <div className="navigation">
        <ul className="nav flex-column">
          <li className="nav-item">
            <Link 
              to="/"
              className={`nav-link ${isActive('/') ? 'active' : ''}`} 
              onClick={() => handleNavigation('/')}
            >
              <i className="bi bi-speedometer2 text-white"></i> Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/attendance"
              className={`nav-link ${isActive('/attendance') ? 'active' : ''}`} 
              onClick={() => handleNavigation('/attendance')}
            >
              <i className="bi bi-clock-history text-white"></i> Clock In/Out
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/attendance-history"
              className={`nav-link ${isActive('/attendance-history') ? 'active' : ''}`} 
              onClick={() => handleNavigation('/attendance-history')}
            >
              <i className="bi bi-calendar-check text-white"></i> Attendance History
            </Link>
          </li>
          <li className="nav-item">
            <Link 
              to="/live-streams"
              className={`nav-link ${isActive('/live-streams') ? 'active' : ''}`} 
              onClick={() => handleNavigation('/live-streams')}
            >
              <i className="bi bi-broadcast text-white"></i> Live Streams
            </Link>
          </li>
          {isPIC && (
            <>
              <li className="nav-item">
                <Link 
                  to="/employees"
                  className={`nav-link ${isActive('/employees') ? 'active' : ''}`} 
                  onClick={() => handleNavigation('/employees')}
                >
                  <i className="bi bi-people text-white"></i> Employee Management
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/office-locations"
                  className={`nav-link ${isActive('/office-locations') ? 'active' : ''}`} 
                  onClick={() => handleNavigation('/office-locations')}
                >
                  <i className="bi bi-geo-alt text-white"></i> Office Locations
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/work-schedules"
                  className={`nav-link ${isActive('/work-schedules') ? 'active' : ''}`} 
                  onClick={() => handleNavigation('/work-schedules')}
                >
                  <i className="bi bi-calendar-week text-white"></i> Work Schedules
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/live-schedule"
                  className={`nav-link ${isActive('/live-schedule') ? 'active' : ''}`} 
                  onClick={() => handleNavigation('/live-schedule')}
                >
                  <i className="bi bi-calendar-event text-white"></i> Live Schedule
                </Link>
              </li>
              <li className="nav-item">
                <Link 
                  to="/approvals"
                  className={`nav-link ${isActive('/approvals') ? 'active' : ''}`} 
                  onClick={() => handleNavigation('/approvals')}
                >
                  <i className="bi bi-check-circle text-white"></i> Approvals
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
      <div className="sidebar-footer">
        <a 
          className="nav-link text-white" 
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-left"></i> Logout
        </a>
      </div>
    </div>
  );
};

export default Sidebar; 