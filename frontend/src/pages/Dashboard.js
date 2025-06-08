import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { Link } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { token, user } = useSelector(state => state.auth);
  const [attendanceCount, setAttendanceCount] = useState('0/0');
  const [pendingApprovals, setPendingApprovals] = useState(0);
  const [workHours, setWorkHours] = useState('9:00 - 17:00');
  const [upcomingEvents, setUpcomingEvents] = useState([
    { title: 'Payday', date: '25th of this month' },
    { title: 'Company Meeting', date: 'Monday, 9:00 AM' }
  ]);
  const [employeeStats, setEmployeeStats] = useState({
    total: 0,
    present: 0,
    onLeave: 0
  });
  const [showSidebar, setShowSidebar] = useState(false);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      // Fetch attendance count
      const attendanceResponse = await axios.get('http://localhost:5000/api/attendance/today-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendanceCount(attendanceResponse.data.count);

      // Fetch pending approvals count if user is PIC
      if (user.role === 'PIC') {
        const approvalsResponse = await axios.get('http://localhost:5000/api/approvals', {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: 'pending' }
        });
        setPendingApprovals(approvalsResponse.data.total || 0);
      }

      // Fetch employee stats if user is PIC
      if (user.role === 'PIC') {
        const statsResponse = await axios.get('http://localhost:5000/api/employees/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setEmployeeStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <div className="dashboard">
      <NavigationBar onHamburgerClick={() => setShowSidebar(v => !v)} />
      <div className="content-wrapper">
        <Sidebar showSidebar={showSidebar} onCloseSidebar={() => setShowSidebar(false)} />
        <div className="main-content">
          <div className="dashboard-cards">
            <div className="card">
              <div className="card-icon attendance">
                <i className="fas fa-clipboard-check"></i>
              </div>
              <div className="card-content">
                <h3>{attendanceCount}</h3>
                <p>Today's Attendance</p>
              </div>
            </div>

            {user.role === 'PIC' && (
              <div className="card">
                <div className="card-icon approvals">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="card-content">
                  <h3>{pendingApprovals}</h3>
                  <p>Pending Approvals</p>
                  <Link to="/approvals" className="card-link">View All</Link>
                </div>
              </div>
            )}

            <div className="card">
              <div className="card-icon work-hours">
                <i className="fas fa-clock"></i>
              </div>
              <div className="card-content">
                <h3>{workHours}</h3>
                <p>Work Hours</p>
              </div>
            </div>
          </div>

          <div className="dashboard-sections">
            <div className="section attendance-status">
              <h2>Attendance Status</h2>
              <div className="status-content">
                <p>Last Clock-in</p>
                <p className="status-text">Not clocked in today</p>
                <Link to="/attendance" className="btn btn-primary">Go to Attendance</Link>
              </div>
            </div>

            {user.role === 'PIC' && (
              <div className="section employee-overview">
                <h2>Employee Overview</h2>
                <div className="stats-grid">
                  <div className="stat-item">
                    <h3>{employeeStats.total}</h3>
                    <p>Total Employees</p>
                  </div>
                  <div className="stat-item">
                    <h3>{employeeStats.present}</h3>
                    <p>Present Today</p>
                  </div>
                  <div className="stat-item">
                    <h3>{employeeStats.onLeave}</h3>
                    <p>On Leave</p>
                  </div>
                </div>
              </div>
            )}

            <div className="section upcoming-events">
              <h2>Upcoming Events</h2>
              <ul className="events-list">
                {upcomingEvents.map((event, index) => (
                  <li key={index}>
                    <h4>{event.title}</h4>
                    <p>{event.date}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 