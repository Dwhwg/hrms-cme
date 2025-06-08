import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import '../styles/HostAccountAssignmentPage.css'; // We will create this CSS file
import '../styles/Dashboard.css'; // Reusing dashboard layout styles

const HostAccountAssignmentPage = () => {
  const [assignmentsData, setAssignmentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [hosts, setHosts] = useState([]);
  const [liveAccounts, setLiveAccounts] = useState([]);
  const [selectedHost, setSelectedHost] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [addAssignmentError, setAddAssignmentError] = useState('');
  const [addAssignmentSuccess, setAddAssignmentSuccess] = useState('');

  // New states for Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [editingHost, setEditingHost] = useState('');
  const [editingAccount, setEditingAccount] = useState('');
  const [editAssignmentError, setEditAssignmentError] = useState('');
  const [editAssignmentSuccess, setEditAssignmentSuccess] = useState('');

  // New states for searchable dropdowns
  const [hostSearchTerm, setHostSearchTerm] = useState('');
  const [filteredHosts, setFilteredHosts] = useState([]);
  const [liveAccountSearchTerm, setLiveAccountSearchTerm] = useState('');
  const [filteredLiveAccounts, setFilteredLiveAccounts] = useState([]);
  const [showHostDropdown, setShowHostDropdown] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  // For multi-select hosts
  const [selectedHosts, setSelectedHosts] = useState([]); // Changed from selectedHost to selectedHosts array

  // New state for filter
  const [filterAccountName, setFilterAccountName] = useState('');

  const token = useSelector(state => state.auth.token);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchHostAccountAssignments();
      fetchHosts();
      fetchLiveAccounts();
    }
  }, [token]);

  // Filter hosts based on search term
  useEffect(() => {
    setFilteredHosts(
      hosts.filter(host =>
        host.employee_name?.toLowerCase().includes(hostSearchTerm.toLowerCase())
      )
    );
  }, [hostSearchTerm, hosts]);

  // Filter live accounts based on search term
  useEffect(() => {
    setFilteredLiveAccounts(
      liveAccounts.filter(account =>
        account.account_name?.toLowerCase().includes(liveAccountSearchTerm.toLowerCase())
      )
    );
  }, [liveAccountSearchTerm, liveAccounts]);

  const fetchHostAccountAssignments = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch host account assignment data from the backend endpoint
      const response = await axios.get('http://localhost:5000/api/host-account-assignments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Assuming the response data is an array with employee_name, account_name, etc.
      setAssignmentsData(response.data);
    } catch (err) {
      console.error('Error fetching host account assignments:', err);
      setError('Failed to fetch host account assignments: ' + (err.response?.data?.error || err.message));
      setAssignmentsData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHosts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/employees/hosts', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('API response for hosts:', response.data); // Log the API response
      setHosts(response.data);
      console.log('Hosts state after setHosts:', response.data); // Log the state after setting
    } catch (err) {
      console.error('Error fetching hosts:', err);
      setError('Failed to fetch hosts: ' + (err.response?.data?.error || err.message));
    }
  };

  const fetchLiveAccounts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/live-accounts', { // Assuming this endpoint exists
        headers: { Authorization: `Bearer ${token}` }
      });
      setLiveAccounts(response.data.data);
    } catch (err) {
      console.error('Error fetching live accounts:', err);
      setError('Failed to fetch live accounts: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleAdd = () => {
    setShowAddModal(true);
    setAddAssignmentError('');
    setAddAssignmentSuccess('');
    // Reset search terms and selected items when opening modal
    setSelectedHosts([]); // Reset for multi-select
    setSelectedAccount('');
    setHostSearchTerm('');
    setLiveAccountSearchTerm('');
    setFilteredHosts(hosts); // Show all hosts initially
    setFilteredLiveAccounts(liveAccounts); // Show all accounts initially
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setShowHostDropdown(false);
    setShowAccountDropdown(false);
  };

  const handleSaveNewAssignment = async (e) => {
    e.preventDefault();
    setAddAssignmentError('');
    setAddAssignmentSuccess('');

    if (selectedHosts.length === 0 || !selectedAccount) {
      setAddAssignmentError('Please select at least one host and an account.');
      return;
    }

    try {
      for (const hostId of selectedHosts) {
        await axios.post('http://localhost:5000/api/host-account-assignments', 
          { host_id: hostId, account_id: selectedAccount },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      setAddAssignmentSuccess('Assignment(s) added successfully!');
      fetchHostAccountAssignments(); // Refresh the list
      setTimeout(() => setShowAddModal(false), 1500); // Close modal after 1.5 seconds
    } catch (err) {
      console.error('Error adding assignment:', err);
      setAddAssignmentError('Failed to add assignment: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEdit = (item) => {
    console.log('Edit assignment:', item);
    setEditingAssignmentId(item.id);
    setEditingHost(item.host_id);
    setEditingAccount(item.account_id);
    setShowEditModal(true);
    setEditAssignmentError('');
    setEditAssignmentSuccess('');
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingAssignmentId(null);
    setEditingHost('');
    setEditingAccount('');
  };

  const handleSaveEditedAssignment = async (e) => {
    e.preventDefault();
    setEditAssignmentError('');
    setEditAssignmentSuccess('');

    if (!editingHost || !editingAccount) {
      setEditAssignmentError('Please select both a host and an account.');
      return;
    }

    try {
      await axios.put(`http://localhost:5000/api/host-account-assignments/${editingAssignmentId}`, 
        { host_id: editingHost, account_id: editingAccount },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditAssignmentSuccess('Assignment updated successfully!');
      fetchHostAccountAssignments(); // Refresh the list
      setTimeout(() => setShowEditModal(false), 1500); // Close modal after 1.5 seconds
    } catch (err) {
      console.error('Error updating assignment:', err);
      setEditAssignmentError('Failed to update assignment: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this assignment?')) {
      try {
        await axios.delete(`http://localhost:5000/api/host-account-assignments/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert('Assignment deleted successfully!');
        fetchHostAccountAssignments(); // Refresh the list
      } catch (err) {
        console.error('Error deleting assignment:', err);
        alert('Failed to delete assignment: ' + (err.response?.data?.error || err.message));
      }
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
            
            <div className="header-with-button">
              <h1>Host Account Assignment</h1>
              <button className="btn btn-primary mb-3" onClick={handleAdd}>
                  <i className="bi bi-plus-lg"></i> Add Assignment
              </button>
            </div>

            {/* Filter Section */}
            <div className="filter-section mb-3">
              <div className="form-group">
                <label htmlFor="filterAccountName">Filter by Account Name</label>
                <select
                  id="filterAccountName"
                  className="form-select"
                  value={filterAccountName}
                  onChange={(e) => setFilterAccountName(e.target.value)}
                >
                  <option value="">All Accounts</option>
                  {liveAccounts.map(account => (
                    <option key={account.id} value={account.account_name}>
                      {account.account_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && <div className="alert alert-danger mt-3">{error}</div>}

            {/* Add Modal */}
            {showAddModal && (
              <div className="modal" style={{ display: showAddModal ? 'block' : 'none' }}>
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Add New Assignment</h5>
                      <button type="button" className="btn-close" onClick={handleCloseAddModal}></button>
                    </div>
                    <div className="modal-body">
                      {addAssignmentError && <div className="alert alert-danger">{addAssignmentError}</div>}
                      {addAssignmentSuccess && <div className="alert alert-success">{addAssignmentSuccess}</div>}
                      <form onSubmit={handleSaveNewAssignment}>
                        <div className="mb-3">
                          <label htmlFor="hostSearchInput" className="form-label">Select Host</label>
                          {/* Multi-select Searchable Host Dropdown */}
                          <div className="dropdown-container">
                            <div className="selected-items-display" onClick={() => setShowHostDropdown(prev => !prev)}>
                              {selectedHosts.length > 0 ? (
                                selectedHosts.map(hostId => {
                                  const host = hosts.find(h => h.id === hostId);
                                  return host ? (
                                    <span key={hostId} className="selected-item-tag">
                                      {console.log('Rendering selected host tag:', host)}
                                      {host.employee_name ?? '[Nama Host Tidak Tersedia]'}
                                      <button type="button" onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedHosts(selectedHosts.filter(id => id !== hostId));
                                      }}>&times;</button>
                                    </span>
                                  ) : null;
                                })
                              ) : (
                                <span className="placeholder-text">-- Select a Host --</span>
                              )}
                              <input
                                id="hostSearchInput"
                                name="hostSearchInput"
                                type="text"
                                className="search-input"
                                value={hostSearchTerm}
                                onChange={(e) => {
                                  setHostSearchTerm(e.target.value);
                                  setShowHostDropdown(true); // Always show dropdown when typing
                                }}
                                onFocus={() => setShowHostDropdown(true)}
                                placeholder="Search hosts..."
                                autoComplete="off"
                              />
                              <span className="dropdown-arrow">&#9660;</span>
                            </div>
                            {showHostDropdown && (
                              <div className="dropdown-options">
                                {filteredHosts.length > 0 ? (
                                  filteredHosts.map(host => (
                                    <div
                                      key={host.id}
                                      className={`dropdown-option ${selectedHosts.includes(host.id) ? 'selected' : ''}`}
                                      onClick={() => {
                                        setSelectedHosts(prev => 
                                          prev.includes(host.id) 
                                            ? prev.filter(id => id !== host.id) 
                                            : [...prev, host.id]
                                        );
                                        setHostSearchTerm(''); // Clear search after selection
                                        // Keep dropdown open for multi-select, unless clicked outside.
                                      }}
                                    >
                                      {console.log('Rendering dropdown option host:', host)}
                                      {host.employee_name ?? '[Nama Host Tidak Tersedia]'}
                                    </div>
                                  ))
                                ) : (
                                  <div className="dropdown-option disabled">No hosts found.</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mb-3">
                          <label htmlFor="accountSearchInput" className="form-label">Select Live Account</label>
                          {/* Single-select Searchable Live Account Dropdown */}
                          <div className="dropdown-container">
                            <div className="selected-items-display" onClick={() => setShowAccountDropdown(prev => !prev)}>
                              {selectedAccount ? (
                                <span className="selected-item-tag">
                                  {console.log('Rendering selected account tag:', liveAccounts.find(acc => acc.id === selectedAccount))}
                                  {liveAccounts.find(acc => acc.id === selectedAccount)?.account_name ?? '[Nama Akun Tidak Tersedia]'}
                                  <button type="button" onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAccount('');
                                  }}>&times;</button>
                                </span>
                              ) : (
                                <span className="placeholder-text">-- Select an Account --</span>
                              )}
                              <input
                                id="accountSearchInput"
                                name="accountSearchInput"
                                type="text"
                                className="search-input"
                                value={liveAccountSearchTerm}
                                onChange={(e) => {
                                  setLiveAccountSearchTerm(e.target.value);
                                  setShowAccountDropdown(true); // Always show dropdown when typing
                                }}
                                onFocus={() => setShowAccountDropdown(true)}
                                placeholder="Search accounts..."
                                autoComplete="off"
                              />
                              <span className="dropdown-arrow">&#9660;</span>
                            </div>
                            {showAccountDropdown && (
                              <div className="dropdown-options">
                                {filteredLiveAccounts.length > 0 ? (
                                  filteredLiveAccounts.map(account => (
                                    <div
                                      key={account.id}
                                      className={`dropdown-option ${selectedAccount === account.id ? 'selected' : ''}`}
                                      onClick={() => {
                                        setSelectedAccount(account.id);
                                        setLiveAccountSearchTerm(''); // Clear search after selection
                                        setShowAccountDropdown(false); // Close dropdown after selection
                                      }}
                                    >
                                      {console.log('Rendering dropdown option account:', account)}
                                      {account.account_name ?? '[Nama Akun Tidak Tersedia]'}
                                    </div>
                                  ))
                                ) : (
                                  <div className="dropdown-option disabled">No accounts found.</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn btn-secondary" onClick={handleCloseAddModal}>Close</button>
                          <button type="submit" className="btn btn-primary">Save Assignment</button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
              <div className="modal" style={{ display: showEditModal ? 'block' : 'none' }}>
                <div className="modal-dialog">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Edit Assignment</h5>
                      <button type="button" className="btn-close" onClick={handleCloseEditModal}></button>
                    </div>
                    <div className="modal-body">
                      {editAssignmentError && <div className="alert alert-danger">{editAssignmentError}</div>}
                      {editAssignmentSuccess && <div className="alert alert-success">{editAssignmentSuccess}</div>}
                      <form onSubmit={handleSaveEditedAssignment}>
                        <div className="mb-3">
                          <label htmlFor="editHostSelect" className="form-label">Select Host</label>
                          <select
                            id="editHostSelect"
                            className="form-select"
                            value={editingHost}
                            onChange={(e) => setEditingHost(e.target.value)}
                            required
                          >
                            <option value="">-- Select a Host --</option>
                            {hosts.map(host => (
                              <option key={host.id} value={host.id}>{host.employee_name || host.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-3">
                          <label htmlFor="editAccountSelect" className="form-label">Select Live Account</label>
                          <select
                            id="editAccountSelect"
                            className="form-select"
                            value={editingAccount}
                            onChange={(e) => setEditingAccount(e.target.value)}
                            required
                          >
                            <option value="">-- Select an Account --</option>
                            {liveAccounts.map(account => (
                              <option key={account.id} value={account.id}>{account.account_name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn btn-secondary" onClick={handleCloseEditModal}>Close</button>
                          <button type="submit" className="btn btn-primary">Save Changes</button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            )}

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
                      <th>No.</th>
                      <th>Employee Name</th>
                      <th>Live Account</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignmentsData.length > 0 ? (
                      assignmentsData
                        .filter(assignment =>
                          assignment.account_name?.toLowerCase().includes(filterAccountName.toLowerCase())
                        )
                        .map((assignment, index) => (
                          <tr key={assignment.id}>
                            <td>{index + 1}</td>
                            <td>{assignment.employee_name}</td>
                            <td>{assignment.account_name}</td>
                            <td>
                              <button
                                className="btn btn-primary btn-sm me-2"
                                onClick={() => handleEdit(assignment)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button
                                className="btn btn-delete btn-sm"
                                onClick={() => handleDelete(assignment.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">No assignments found.</td>
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

export default HostAccountAssignmentPage; 