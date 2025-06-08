import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../components/Sidebar';
import '../styles/AttendanceHistoryPage.css';
import '../styles/Dashboard.css';

const AttendanceHistoryPage = () => {
  const { token, user } = useSelector(state => state.auth);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);

  // Fetch departments from employees
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/employees', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Extract unique departments from employees
        const uniqueDepartments = [...new Set(response.data.map(emp => emp.department))];
        setDepartments(uniqueDepartments);
      } catch (error) {
        console.error('Error fetching departments:', error);
        setError('Failed to fetch departments');
      }
    };

    fetchDepartments();
  }, [token]);

  // Fetch attendance history when department or filters change
  useEffect(() => {
    fetchAttendanceHistory();
  }, [selectedDepartment, filterMonth, filterYear, filterType]);

  // Fetch attendance history based on filters
  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      let url = 'http://localhost:5000/api/attendances';
      let params = [];
      
      // Add department filter if not 'all'
      if (selectedDepartment !== 'all') {
        params.push(`department=${selectedDepartment}`);
      }
      
      // Add other filter conditions
      if (filterMonth) {
        params.push(`month=${filterMonth}`);
      }
      
      if (filterYear) {
        params.push(`year=${filterYear}`);
      }
      
      if (filterType) {
        params.push(`type=${filterType}`);
      }
      
      // Build URL with parameters
      if (params.length > 0) {
        url += '?' + params.join('&');
      }
      
      console.log('Fetching attendance history:', url);
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Received attendance records:', response.data.length);
      setAttendanceHistory(response.data);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      setError('Failed to fetch attendance history: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <NavigationBar onHamburgerClick={() => setShowSidebar(v => !v)} />
      <Sidebar showSidebar={showSidebar} onCloseSidebar={() => setShowSidebar(false)} />
      <div className="main-content">
        <div className="attendance-history-page">
          <h1>Attendance History</h1>
          
          <div className="filters-section">
            <div className="filter-group">
              <label>Department:</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Departments</option>
                {departments.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Month:</label>
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="filter-select"
              >
                <option value="">All Months</option>
                <option value="1">January</option>
                <option value="2">February</option>
                <option value="3">March</option>
                <option value="4">April</option>
                <option value="5">May</option>
                <option value="6">June</option>
                <option value="7">July</option>
                <option value="8">August</option>
                <option value="9">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Year:</label>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="filter-select"
              >
                <option value="">All Years</option>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Type:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="">All Types</option>
                <option value="IN">Clock In</option>
                <option value="OUT">Clock Out</option>
              </select>
            </div>

            <button 
              className="btn btn-primary btn-refresh" 
              onClick={fetchAttendanceHistory}
            >
              Refresh
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="attendance-data-section">
            {loading ? (
              <div className="loading-indicator">
                <p>Loading attendance records...</p>
              </div>
            ) : attendanceHistory.length === 0 ? (
              <div className="no-records">
                <p>No attendance records found.</p>
              </div>
            ) : (
              <div className="attendance-table-container">
                <table className="attendance-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Photo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceHistory.map((record) => (
                      <tr key={record.id}>
                        <td>{new Date(record.created_at).toLocaleDateString()}</td>
                        <td>{new Date(record.created_at).toLocaleTimeString()}</td>
                        <td>{record.employee_name}</td>
                        <td>{record.department_name}</td>
                        <td>{record.type}</td>
                        <td>
                          {record.latitude && record.longitude ? (
                            <a
                              href={`https://www.google.com/maps?q=${record.latitude},${record.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Location
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </td>
                        <td>
                          {record.photo_url ? (
                            <a
                              href={`http://localhost:5000${record.photo_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              View Photo
                            </a>
                          ) : (
                            'No Photo'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistoryPage; 