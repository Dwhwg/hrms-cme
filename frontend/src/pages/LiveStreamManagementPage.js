import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../components/Sidebar';
import '../styles/LiveStreamManagementPage.css';
import '../styles/Dashboard.css';

const LiveStreamManagementPage = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [streams, setStreams] = useState([]);
  const [officeLocations, setOfficeLocations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    accountName: '',
    accountCode: '',
    platform: 'tiktok',
    startTime: '',
    endTime: '',
    location: '',
    mainHosts: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Get user info from Redux
  const { token, user } = useSelector(state => state.auth);
  
  const navigate = useNavigate();
  
  // Initialize data
  useEffect(() => {
    if (token) {
      fetchStreams();
      fetchOfficeLocations();
      fetchEmployees();
    }
  }, [token]);
  
  // Fetch live streams
  const fetchStreams = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('http://localhost:5000/api/live-accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Always set streams as an array
      let data = response.data;
      if (Array.isArray(data)) {
        setStreams(data);
      } else if (data && Array.isArray(data.data)) {
        setStreams(data.data);
      } else if (data && Array.isArray(data.streams)) {
        setStreams(data.streams);
      } else {
        setStreams([]); // fallback to empty array
      }
    } catch (error) {
      console.error('Error fetching streams:', error);
      setError('Failed to fetch live streams: ' + (error.response?.data?.message || error.message));
      setStreams([]); // fallback to empty array on error
    } finally {
      setLoading(false);
    }
  };

  // Fetch office locations
  const fetchOfficeLocations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/office-locations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOfficeLocations(response.data);
    } catch (error) {
      console.error('Error fetching office locations:', error);
    }
  };

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };
  
  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Add host
  const handleAddHost = (employee) => {
    if (!formData.mainHosts.includes(employee.id)) {
      setFormData(prev => ({
        ...prev,
        mainHosts: [...prev.mainHosts, employee.id]
      }));
    }
  };
  
  // Remove host
  const handleRemoveHost = (employeeId) => {
    setFormData(prev => ({
      ...prev,
      mainHosts: prev.mainHosts.filter(id => id !== employeeId)
    }));
  };
  
  // Helper to calculate duration in hours
  const calculateDuration = (start, end) => {
    if (!start || !end) return '';
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    let duration = (endH + endM / 60) - (startH + startM / 60);
    if (duration < 0) duration += 24; // handle overnight
    return Math.round(duration * 100) / 100;
  };

  // Helper to calculate switch host every
  const calculateSwitchHostEvery = (duration, slotQty) => {
    if (!duration || !slotQty || slotQty === 0) return '';
    // Calculate without rounding down
    return duration / slotQty;
  };

  // Update duration and switch_host_every automatically
  useEffect(() => {
    const duration = calculateDuration(formData.startTime, formData.endTime);
    const switchHostEvery = calculateSwitchHostEvery(duration, formData.slot_qty);
    setFormData(prev => ({
      ...prev,
      duration: duration || '',
      switch_host_every: switchHostEvery || ''
    }));
    // eslint-disable-next-line
  }, [formData.startTime, formData.endTime, formData.slot_qty]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (
      !formData.accountName ||
      !formData.accountCode ||
      !formData.location ||
      !formData.startTime ||
      !formData.endTime ||
      !formData.duration ||
      !formData.slot_qty ||
      !formData.switch_host_every ||
      !formData.total_host_by_day
    ) {
      setError('All fields are required, including duration and switch host every.');
      return;
    }

    // Ensure values are numbers and not zero, and round integer fields for backend
    const duration = Number(formData.duration);
    const slotQty = Number(formData.slot_qty);
    // Round switchHostEvery to the nearest integer for the backend
    const switchHostEvery = Math.round(Number(formData.switch_host_every));
    const totalHostByDay = Number(formData.total_host_by_day);

    if (!duration || !slotQty || !switchHostEvery || !totalHostByDay) {
      setError('Duration, slot quantity, switch host every, and total host by day must be valid numbers and not zero.');
      return;
    }

    // Prepare data for backend
    const data = {
      account_name: formData.accountName,
      account_code: formData.accountCode,
      platform: formData.platform,
      start_time: formData.startTime,
      end_time: formData.endTime,
      location: formData.location,
      duration: duration,
      slot_qty: slotQty,
      switch_host_every: switchHostEvery, // Send as integer
      total_host_by_day: totalHostByDay,
      with_cohost: !!formData.with_cohost
    };

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      if (isEditing) {
        await axios.put(
          `http://localhost:5000/api/live-accounts/${editId}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess('Live stream updated successfully!');
      } else {
        await axios.post(
          'http://localhost:5000/api/live-accounts',
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuccess('Live stream created successfully!');
      }

      resetForm();
      fetchStreams();
      setShowForm(false);
    } catch (error) {
      console.error('Error submitting stream:', error);
      setError('Operation failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Edit stream
  const handleEdit = (stream) => {
    // Format waktu dari backend ke format input time
    const formatTimeForInput = (time) => {
      if (!time) return '';
      return time.includes('T') ? time.split('T')[1].substring(0, 5) : time.substring(0, 5);
    };

    setFormData({
      accountName: stream.account_name,
      accountCode: stream.account_code,
      platform: stream.platform,
      startTime: formatTimeForInput(stream.start_time),
      endTime: formatTimeForInput(stream.end_time),
      location: stream.location,
      mainHosts: stream.main_hosts?.map(host => host.id) || []
    });
    setIsEditing(true);
    setEditId(stream.id);
    setShowForm(true);
  };
  
  // Delete stream
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this live stream?')) {
      return;
    }
    
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/live-accounts/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Live stream deleted successfully!');
      fetchStreams();
    } catch (error) {
      console.error('Error deleting stream:', error);
      setError('Failed to delete live stream: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };
  
  // Reset form
  const resetForm = () => {
    setFormData({
      accountName: '',
      accountCode: '',
      platform: 'tiktok',
      startTime: '',
      endTime: '',
      location: '',
      mainHosts: []
    });
    setIsEditing(false);
    setEditId(null);
    setSearchTerm('');
  };

  // Add new stream
  const handleAddStream = () => {
    resetForm();
    setShowForm(true);
  };

  // Close form
  const handleCloseForm = () => {
    resetForm();
    setShowForm(false);
  };

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderLocation = (location) => {
    return location || 'No location assigned';
  };

  const renderMainHosts = (hosts) => {
    if (!hosts || !Array.isArray(hosts) || hosts.length === 0) {
      return 'No hosts assigned';
    }
    return hosts.map(host => host.name).join(', ');
  };

  const handleCardClick = (path) => {
    navigate(path);
  };

  return (
    <div className="dashboard-container">
      <NavigationBar onHamburgerClick={() => setShowSidebar(v => !v)} />
      <div className="dashboard-content">
        <Sidebar showSidebar={showSidebar} onCloseSidebar={() => setShowSidebar(false)} />
        <main className="main-content">
          <div className="container-fluid">
            <h1 className="mb-4">Live Stream Management</h1>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <div className="row">
              {/* Live Accounts Management Card */}
              <div className="col-md-6 mb-4">
                <div 
                  className="card h-100 management-card"
                  onClick={() => handleCardClick('/live-accounts')}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title mb-0">Live Accounts Management</h5>
                      <i className="bi bi-chevron-right"></i>
                    </div>
                    <p className="card-text text-muted">
                      Manage live streaming accounts, schedules, and configurations
                    </p>
                  </div>
                </div>
              </div>

              {/* Hosts Management Card */}
              <div className="col-md-6 mb-4">
                <div 
                  className="card h-100 management-card"
                  onClick={() => handleCardClick('/host-management')}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title mb-0">Hosts Management</h5>
                      <i className="bi bi-chevron-right"></i>
                    </div>
                    <p className="card-text text-muted">
                      Manage host profiles, skills, and performance metrics
                    </p>
                  </div>
                </div>
              </div>

              {/* Host Availability Management Card */}
              <div className="col-md-6 mb-4">
                <div 
                  className="card h-100 management-card"
                  onClick={() => handleCardClick('/host-availability')}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title mb-0">Host Availability Management</h5>
                      <i className="bi bi-chevron-right"></i>
                    </div>
                    <p className="card-text text-muted">
                      Set and manage host availability schedules and time slots
                    </p>
                  </div>
                </div>
              </div>

              {/* Host Account Assignment Card */}
              <div className="col-md-6 mb-4">
                <div 
                  className="card h-100 management-card"
                  onClick={() => handleCardClick('/host-account-assignment')}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="card-title mb-0">Host Account Assignment</h5>
                      <i className="bi bi-chevron-right"></i>
                    </div>
                    <p className="card-text text-muted">
                      Assign hosts to live accounts and manage assignments
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {showForm && (
              <div className="modal show d-block" tabIndex="-1">
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">
                        {isEditing ? 'Edit Live Stream' : 'Add New Live Stream'}
                      </h5>
                      <button type="button" className="btn-close" onClick={handleCloseForm}></button>
                    </div>
                    <div className="modal-body">
                      <form onSubmit={handleSubmit}>
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Account Name</label>
                            <input
                              type="text"
                              className="form-control"
                              name="accountName"
                              value={formData.accountName}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Account Code</label>
                            <input
                              type="text"
                              className="form-control"
                              name="accountCode"
                              value={formData.accountCode}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Platform</label>
                            <select
                              className="form-select"
                              name="platform"
                              value={formData.platform}
                              onChange={handleChange}
                              required
                            >
                              <option value="tiktok">TikTok</option>
                              <option value="shopee">Shopee</option>
                              <option value="others">Others</option>
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Location</label>
                            <select
                              className="form-select"
                              name="location"
                              value={formData.location}
                              onChange={handleChange}
                              required
                            >
                              <option value="">Select Location</option>
                              {officeLocations.map(location => (
                                <option key={location.id} value={location.name}>
                                  {location.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Start Time</label>
                            <input
                              type="time"
                              className="form-control"
                              name="startTime"
                              value={formData.startTime}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">End Time</label>
                            <input
                              type="time"
                              className="form-control"
                              name="endTime"
                              value={formData.endTime}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-md-4">
                            <label className="form-label">Duration (hours)</label>
                            <input
                              type="number"
                              className="form-control"
                              name="duration"
                              value={formData.duration || ''}
                              readOnly
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Slot Quantity</label>
                            <input
                              type="number"
                              className="form-control"
                              name="slot_qty"
                              value={formData.slot_qty || ''}
                              onChange={handleChange}
                              min="1"
                              required
                            />
                          </div>
                          <div className="col-md-4">
                            <label className="form-label">Switch Host Every (hours)</label>
                            <input
                              type="number"
                              className="form-control"
                              name="switch_host_every"
                              value={formData.switch_host_every || ''}
                              readOnly
                            />
                          </div>
                        </div>
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Total Host By Day</label>
                            <input
                              type="number"
                              className="form-control"
                              name="total_host_by_day"
                              value={formData.total_host_by_day || ''}
                              onChange={handleChange}
                              min="1"
                              required
                            />
                          </div>
                          <div className="col-md-6 d-flex align-items-center">
                            <label className="form-label me-3">With Co-host</label>
                            <input
                              type="checkbox"
                              className="form-check-input"
                              name="with_cohost"
                              checked={!!formData.with_cohost}
                              onChange={e => setFormData(prev => ({ ...prev, with_cohost: e.target.checked }))}
                            />
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn btn-secondary" onClick={handleCloseForm}>
                            Cancel
                          </button>
                          <button type="submit" className="btn btn-primary" disabled={loading}>
                            {isEditing ? 'Update' : 'Create'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LiveStreamManagementPage; 