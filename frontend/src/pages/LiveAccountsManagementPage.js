import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../components/Sidebar';
import '../styles/LiveStreamManagementPage.css'; // Reusing styles for now
import '../styles/Dashboard.css'; // Reusing dashboard layout styles
import { useNavigate } from 'react-router-dom'; // Import useNavigate

const LiveAccountsManagementPage = () => {
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
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const navigate = useNavigate(); // Initialize useNavigate
  
  // Get user info from Redux
  const { token, user } = useSelector(state => state.auth);
  
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
      // Sort streams by ID in ascending order
      setStreams(prevStreams => [...prevStreams].sort((a, b) => (a.id || 0) - (b.id || 0)));
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
      setOfficeLocations(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching office locations:', error);
      setOfficeLocations([]); // fallback to empty array on error
    }
  };

  // Fetch employees
  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]); // fallback to empty array on error
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
      with_cohost: !!formData.with_cohost,
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
    const formatTimeForInput = (time) => {
      if (!time) return '';
      // Ensure time is in HH:mm format
      const date = new Date(time);
      if (!isNaN(date)) {
          return date.toTimeString().substring(0, 5);
      } else {
          // Fallback for time strings like "HH:mm:ss"
          return time.substring(0, 5);
      }
    };

    setFormData({
      accountName: stream.account_name || '',
      accountCode: stream.account_code || '',
      platform: stream.platform || 'tiktok',
      startTime: formatTimeForInput(stream.start_time),
      endTime: formatTimeForInput(stream.end_time),
      location: stream.location || '',
      duration: stream.duration || '',
      slot_qty: stream.slot_qty || '',
      switch_host_every: stream.switch_host_every || '',
      total_host_by_day: stream.total_host_by_day || '',
      with_cohost: !!stream.with_cohost, // Ensure boolean
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
      duration: '',
      slot_qty: '',
      switch_host_every: '',
      total_host_by_day: '',
      with_cohost: false,
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

  // Filter employees based on search term (if employees list is used elsewhere)
  const filteredEmployees = Array.isArray(employees) ? employees.filter(employee => 
    employee.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Helper to render location name
  const renderLocation = (location) => {
    const locationObj = Array.isArray(officeLocations) ? officeLocations.find(loc => loc.name === location) : undefined;
    return locationObj ? locationObj.name : location || 'No location assigned';
  };

  return (
    <div className="dashboard-container">
      <NavigationBar onHamburgerClick={() => setShowSidebar(v => !v)} />
      <div className="dashboard-content">
        <Sidebar showSidebar={showSidebar} onCloseSidebar={() => setShowSidebar(false)} />
        <main className="main-content">
          <div className="container-fluid">
            <div className="d-flex justify-content-between align-items-center mb-4">
               {/* Back button */}
              <button className="btn btn-secondary me-2" onClick={() => navigate('/live-streams')}> {/* Use navigate(-1) to go back */}
                <i className="bi bi-arrow-left"></i> Back
              </button>
              <h1>Live Accounts Management</h1>
              <button className="btn btn-primary" onClick={handleAddStream}>
                <i className="bi bi-plus-lg"></i> Add New Stream Account
              </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {loading ? (
              <div className="text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Account Name</th>
                      <th>Account Code</th>
                      <th>Platform</th>
                      <th>Location</th>
                      <th>Start Time</th>
                      <th>End Time</th>
                      <th>Duration (hours)</th>
                      <th>Slot Quantity</th>
                      <th>Switch Host Every (hours)</th>
                      <th>Total Host By Day</th>
                      <th>With Co-host</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(streams) && streams.map(stream => (
                      <tr key={stream.id}>
                        <td>{stream.id}</td>
                        <td>{stream.account_name}</td>
                        <td>{stream.account_code}</td>
                        <td>{stream.platform}</td>
                        <td>{renderLocation(stream.location)}</td>
                        <td>{stream.start_time ? stream.start_time.substring(0, 5) : ''}</td>
                        <td>{stream.end_time ? stream.end_time.substring(0, 5) : ''}</td>
                        <td>{stream.duration}</td>
                        <td>{stream.slot_qty}</td>
                        <td>{stream.switch_host_every ? Number(stream.switch_host_every).toFixed(2) : ''}</td>
                        <td>{stream.total_host_by_day}</td>
                        <td>{stream.with_cohost ? 'Yes' : 'No'}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleEdit(stream)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(stream.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {showForm && (
              <div className="modal show d-block" tabIndex="-1">
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">
                        {isEditing ? 'Edit Live Stream Account' : 'Add New Live Stream Account'}
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
                              {Array.isArray(officeLocations) && officeLocations.map(location => (
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

export default LiveAccountsManagementPage; 