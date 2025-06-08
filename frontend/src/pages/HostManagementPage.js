import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import '../styles/HostManagementPage.css'; // We will create this CSS file
import '../styles/Dashboard.css'; // Reusing dashboard layout styles

const HostManagementPage = () => {
  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [success, setSuccess] = useState('');
  // New state for filter
  const [filterIsActive, setFilterIsActive] = useState(''); // '' for All, 'true' for Yes, 'false' for No

  const token = useSelector(state => state.auth.token);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchHosts();
    }
  }, [token]);

  const fetchHosts = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch hosts from the new backend endpoint
      const response = await axios.get('http://localhost:5000/api/employees/hosts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Assuming the response data is an array of employees with position 'Host Live Streaming'
      // We will map employee data to represent host data for the table
      const hostData = response.data.map(employee => ({
        id: employee.id,
        employeeName: employee.employee_name,
        isActive: employee.is_active,
        // The response now includes id, employee_id, is_active from hosts table
        // and employee_name from employees table via JOIN
      }));
      setHosts(hostData);
    } catch (err) {
      console.error('Error fetching hosts:', err);
      setError('Failed to fetch hosts: ' + (err.response?.data?.error || err.message));
      setHosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Placeholder for future edit/delete actions
  const handleEdit = (host) => {
    console.log('Edit host:', host);
    // Implement edit logic later
  };

  const handleDelete = async (hostId) => {
    if (!window.confirm('Are you sure you want to delete this host?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      // Send DELETE request to backend endpoint
      await axios.delete(`http://localhost:5000/api/employees/hosts/${hostId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Host deleted successfully!');
      // Remove the deleted host from the state
      setHosts(prevHosts => prevHosts.filter(host => host.id !== hostId));
    } catch (error) {
      console.error('Error deleting host:', error);
      setError('Failed to delete host: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <NavigationBar onHamburgerClick={() => setShowSidebar(v => !v)} />
      <div className="dashboard-content">
        <Sidebar showSidebar={showSidebar} onCloseSidebar={() => setShowSidebar(false)} />
        <main className="main-content">
          <div className="container-fluid">
             {/* Back button */}
            <button className="btn btn-secondary mb-3" onClick={() => navigate('/live-streams')}>
                <i className="bi bi-arrow-left"></i> Back
            </button>
            <h1>Host Management</h1>

            {error && <div className="alert alert-danger mt-3">{error}</div>}
            {success && <div className="alert alert-success mt-3">{success}</div>}

            {/* Filter Section */}
            <div className="filter-section mb-3">
              <div className="form-group">
                <label htmlFor="filterIsActive">Filter by Active Status</label>
                <select
                  id="filterIsActive"
                  className="form-select"
                  value={filterIsActive}
                  onChange={(e) => setFilterIsActive(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center mt-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive mt-4">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>No.</th> {/* Changed from ID to No. */}
                      <th>Employee Name</th>
                      <th>Is Active</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hosts.length > 0 ? (
                      hosts
                        .filter(host => {
                          if (filterIsActive === '') return true; // Show all if no filter selected
                          if (filterIsActive === 'true') return host.isActive === true; // Show only active
                          if (filterIsActive === 'false') return host.isActive === false; // Show only inactive
                          return true;
                        })
                        .map((host, index) => (
                        <tr key={host.id}>
                          <td>{index + 1}</td> {/* Display serial number */}
                          <td>{host.employeeName}</td>
                          <td>{host.isActive ? 'Yes' : 'No'}</td>
                          <td>
                            {/* Edit button removed as per request */}
                            <button className="btn btn-sm btn-danger" onClick={() => handleDelete(host.id)}>
                              <i className="bi bi-trash"></i> Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">No hosts found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
};

export default HostManagementPage; 