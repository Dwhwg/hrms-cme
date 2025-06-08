import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../components/Sidebar';
import { useNavigate } from 'react-router-dom';
import '../styles/HostAvailabilityManagementPage.css'; // We will create this CSS file
import '../styles/Dashboard.css'; // Reusing dashboard layout styles

const HostAvailabilityManagementPage = () => {
  const [availabilityData, setAvailabilityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState('');

  const token = useSelector(state => state.auth.token);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      fetchHostAvailability();
    }
  }, [token]);

  const fetchHostAvailability = async () => {
    try {
      setLoading(true);
      setError('');
      // Fetch host availability data from the backend endpoint
      const response = await axios.get('http://localhost:5000/api/employees/host-availability', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Assuming the response data is an array with employee_name, date, is_available, etc.
      setAvailabilityData(response.data);
    } catch (err) {
      console.error('Error fetching host availability:', err);
      setError('Failed to fetch host availability data: ' + (err.response?.data?.error || err.message));
      setAvailabilityData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    console.log('ITEM YANG DIEDIT:', item);
    setEditingItem(item);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingItem(null);
    setEditError('');
    setEditSuccess('');
  };

  const handleSaveEdit = async () => {
    try {
      setEditError('');
      setEditSuccess('');
      await axios.patch(`http://localhost:5000/api/employees/host-availability/${editingItem.id}`, 
        { is_available: editingItem.is_available },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditSuccess('Availability updated successfully!');
      fetchHostAvailability(); // Refresh the list
      setTimeout(() => setShowEditModal(false), 1500); // Close modal after 1.5 seconds
    } catch (err) {
      console.error('Error updating availability:', err);
      setEditError('Failed to update availability: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this availability record?')) {
      return;
    }

    try {
      setDeleteError('');
      setDeleteSuccess('');
      await axios.delete(`http://localhost:5000/api/employees/host-availability/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeleteSuccess('Availability record deleted successfully!');
      fetchHostAvailability(); // Refresh the list
    } catch (err) {
      console.error('Error deleting availability:', err);
      setDeleteError('Failed to delete availability: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleBatchDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} availability records?`)) {
      return;
    }

    try {
      setDeleteError('');
      setDeleteSuccess('');
      // Delete each selected record
      await Promise.all(selectedIds.map(id => 
        axios.delete(`http://localhost:5000/api/employees/host-availability/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));
      setDeleteSuccess(`${selectedIds.length} availability records deleted successfully!`);
      setSelectedIds([]); // Clear selection
      fetchHostAvailability(); // Refresh the list
    } catch (err) {
      console.error('Error batch deleting availability:', err);
      setDeleteError('Failed to delete some availability records: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = availabilityData.map(item => item.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
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
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h1>Host Availability Management</h1>
              <button className="btn btn-danger" onClick={handleBatchDelete}>
                <i className="bi bi-trash"></i> Delete Selected
              </button>
            </div>

            {error && <div className="alert alert-danger mt-3">{error}</div>}
            {deleteError && <div className="alert alert-danger mt-3">{deleteError}</div>}
            {deleteSuccess && <div className="alert alert-success mt-3">{deleteSuccess}</div>}

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
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedIds.length === availabilityData.length && availabilityData.length > 0}
                          onChange={handleSelectAll}
                        /> Select
                      </th>
                      <th>Employee Name</th>
                      <th>Date</th>
                      <th>Is Available</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availabilityData.length > 0
                      ? availabilityData.map(item => (
                          <tr key={item.id}>
                            <td>
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedIds([...selectedIds, item.id]);
                                  } else {
                                    setSelectedIds(selectedIds.filter((id) => id !== item.id));
                                  }
                                }}
                              />
                            </td>
                            <td>{item.employee_name}</td>
                            <td>{new Date(item.date).toLocaleDateString()}</td>
                            <td>{item.is_available ? 'Yes' : 'No'}</td>
                            <td>
                              <button className="btn btn-sm btn-primary me-2" onClick={() => handleEdit(item)} title="Edit">
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)} title="Delete">
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      : (
                          <tr>
                            <td colSpan="5" className="text-center">No host availability data found.</td>
                          </tr>
                        )}
                  </tbody>
                </table>
                
              </div>
            )}

          </div>
        </main>
      </div>

      {showEditModal && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Edit Host Availability</h5>
                <button type="button" className="btn-close" onClick={handleCloseEditModal}></button>
              </div>
              <div className="modal-body">
                {editError && <div className="alert alert-danger">{editError}</div>}
                {editSuccess && <div className="alert alert-success">{editSuccess}</div>}
                <div className="mb-3">
                  <label className="form-label">Employee Name</label>
                  <input type="text" className="form-control" value={editingItem?.employee_name} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={
                      editingItem?.date
                        ? (() => {
                            const dateObj = new Date(editingItem.date);
                            const year = dateObj.getFullYear();
                            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const day = String(dateObj.getDate()).padStart(2, '0');
                            return `${year}-${month}-${day}`;
                          })()
                        : ''
                    }
                    disabled 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Availability</label>
                  <select 
                    className="form-select"
                    value={editingItem?.is_available}
                    onChange={(e) => setEditingItem({...editingItem, is_available: e.target.value === 'true'})}
                  >
                    <option value="true">Available</option>
                    <option value="false">Not Available</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseEditModal}>Close</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>Save changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostAvailabilityManagementPage; 