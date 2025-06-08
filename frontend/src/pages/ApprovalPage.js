import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { format } from 'date-fns';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../components/Sidebar';
import '../styles/ApprovalPage.css';

const ApprovalPage = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [approvals, setApprovals] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedType, setSelectedType] = useState('all');
  const [showSidebar, setShowSidebar] = useState(false);

  // Get user info from Redux
  const { token, user } = useSelector(state => state.auth);

  // Fetch approvals
  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/approvals', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: itemsPerPage,
          status: selectedStatus,
          type: selectedType !== 'all' ? selectedType : undefined
        }
      });

      if (response.data) {
        setApprovals(response.data.data || response.data);
        setTotalPages(Math.ceil((response.data.total || response.data.length) / itemsPerPage));
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
      setError('Failed to fetch approvals: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle approval action
  const handleApprovalAction = async (id, action) => {
    try {
      setLoading(true);
      await axios.put(`http://localhost:5000/api/approvals/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess(`Approval ${action}ed successfully!`);
      fetchApprovals();
    } catch (error) {
      console.error(`Error ${action}ing approval:`, error);
      setError(`Failed to ${action} approval: ` + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'status') {
      setSelectedStatus(value);
    } else if (name === 'type') {
      setSelectedType(value);
    }
  };

  // Initialize data
  useEffect(() => {
    if (token) {
      fetchApprovals();
    }
  }, [token, currentPage, selectedStatus, selectedType]);

  return (
    <div className="approval-page">
      <NavigationBar onHamburgerClick={() => setShowSidebar(v => !v)} />
      <div className="content-wrapper">
        <Sidebar showSidebar={showSidebar} onCloseSidebar={() => setShowSidebar(false)} />
        <div className="main-content">
          <h1>Approval Management</h1>
          
          <div className="filters-section">
            <div className="filters-row">
              <div className="filters-group">
                <div className="filter-item">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={selectedStatus}
                    onChange={handleFilterChange}
                    name="status"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                
                <div className="filter-item">
                  <label className="form-label">Type</label>
                  <select
                    className="form-select"
                    value={selectedType}
                    onChange={handleFilterChange}
                    name="type"
                  >
                    <option value="all">All Types</option>
                    <option value="work_schedule">Work Schedule</option>
                    <option value="leave">Leave Request</option>
                    <option value="overtime">Overtime</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {loading && <div className="loading-spinner">Loading...</div>}
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="table-responsive">
            <table className="approval-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Requester</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((approval) => (
                  <tr key={approval.id}>
                    <td>{format(new Date(approval.created_at), 'yyyy-MM-dd')}</td>
                    <td>{approval.type}</td>
                    <td>{approval.requester_name}</td>
                    <td>{approval.details}</td>
                    <td>
                      <span className={`status-badge status-${approval.status}`}>
                        {approval.status}
                      </span>
                    </td>
                    <td>
                      {approval.status === 'pending' && (
                        <div className="action-buttons">
                          <button
                            className="action-button approve-button"
                            onClick={() => handleApprovalAction(approval.id, 'approve')}
                          >
                            Approve
                          </button>
                          <button
                            className="action-button reject-button"
                            onClick={() => handleApprovalAction(approval.id, 'reject')}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pagination-container">
            <button
              className={`pagination-button ${currentPage === 1 ? 'disabled' : ''}`}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button
              className={`pagination-button ${currentPage === totalPages ? 'disabled' : ''}`}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalPage; 