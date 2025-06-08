import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { format } from 'date-fns';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../components/Sidebar';
import '../styles/WorkSchedulePage.css';

const WorkSchedulePage = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [schedules, setSchedules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [positions, setPositions] = useState([]);
  const [officeLocations, setOfficeLocations] = useState([]);
  const [liveAccounts, setLiveAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    position: '',
    startDate: '',
    endDate: '',
    employeeId: '',
    startTime: '',
    endTime: '',
    schedule_type: '',
    notes: ''
  });
  
  // Filter states
  const [filterType, setFilterType] = useState('day');
  const today = new Date();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedPosition, setSelectedPosition] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showSidebar, setShowSidebar] = useState(false);

  // Get user info from Redux
  const { token, user } = useSelector(state => state.auth);

  // Initialize data with date range
  useEffect(() => {
    if (token) {
      const currentDate = new Date();
      setStartDate(currentDate);
      setEndDate(currentDate);
      fetchSchedules();
      fetchEmployees();
      fetchPositions();
      fetchOfficeLocations();
    }
  }, [token]);

  // Fetch schedules
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      console.log('Fetching schedules with params:', {
        page: currentPage,
        limit: itemsPerPage,
        start_date: format(new Date(startDate), 'yyyy-MM-dd'),
        end_date: format(new Date(endDate), 'yyyy-MM-dd'),
        position: selectedPosition !== 'all' ? selectedPosition : undefined,
        status: selectedStatus === 'on' ? false : selectedStatus === 'off' ? true : undefined
      });

      const response = await axios.get('http://localhost:5000/api/work-schedules', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: itemsPerPage,
          start_date: format(new Date(startDate), 'yyyy-MM-dd'),
          end_date: format(new Date(endDate), 'yyyy-MM-dd'),
          position: selectedPosition !== 'all' ? selectedPosition : undefined,
          status: selectedStatus === 'on' ? false : selectedStatus === 'off' ? true : undefined
        }
      });
      
      console.log('Raw response:', response);
      console.log('Response data:', response.data);
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          console.log('Setting schedules from array:', response.data);
          setSchedules(response.data);
          setTotalPages(Math.ceil(response.data.length / itemsPerPage));
        } else if (response.data.data) {
          console.log('Setting schedules from data property:', response.data.data);
          setSchedules(response.data.data);
          setTotalPages(Math.ceil(response.data.total / itemsPerPage));
        } else if (response.data.schedules) {
          console.log('Setting schedules from schedules property:', response.data.schedules);
          setSchedules(response.data.schedules);
          setTotalPages(Math.ceil(response.data.total / itemsPerPage));
        } else {
          console.error('Unexpected response format:', response.data);
          setSchedules([]);
          setTotalPages(1);
        }
      } else {
        console.log('No data in response');
        setSchedules([]);
        setTotalPages(1);
      }

      console.log('Final schedules state:', schedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setError('Failed to fetch schedules: ' + error.message);
      setSchedules([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
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

  // Fetch positions
  const fetchPositions = async () => {
    try {
      console.log('Fetching positions...');
      const response = await axios.get('http://localhost:5000/api/employees/positions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Positions response:', response.data);
      setPositions(response.data);
    } catch (error) {
      console.error('Error fetching positions:', error);
      setError('Failed to fetch positions: ' + (error.response?.data?.error || error.message));
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

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    switch (name) {
      case 'filterType':
        setFilterType(value);
        break;
      case 'startDate':
        if (new Date(value) <= new Date(endDate)) {
          setStartDate(value);
        }
        break;
      case 'endDate':
        const maxDate = new Date(startDate);
        maxDate.setDate(maxDate.getDate() + 90);
        if (new Date(value) <= maxDate) {
          setEndDate(value);
        }
        break;
      case 'position':
        setSelectedPosition(value);
        break;
      case 'employee':
        setSelectedEmployee(value);
        break;
      case 'status':
        setSelectedStatus(value);
        break;
      default:
        break;
    }
  };

  // Process schedules to show daily entries
  const processSchedules = (schedules) => {
    if (!Array.isArray(schedules)) return [];
    
    const dailySchedules = [];
    
    schedules.forEach(schedule => {
      const startDate = new Date(schedule.start_date);
      const endDate = new Date(schedule.end_date);
      
      // Loop through each day between start_date and end_date
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const currentDate = new Date(date);
        
        dailySchedules.push({
          id: schedule.id,
          date: currentDate,
          position: schedule.position,
          employee_name: schedule.employee_name,
          employee_id: schedule.employee_id,
          live_account_name: schedule.live_account_name,
          live_account_id: schedule.live_account_id,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
        });
      }
    });

    // Sort by date and employee name
    return dailySchedules.sort((a, b) => {
      const dateCompare = a.date.getTime() - b.date.getTime();
      if (dateCompare !== 0) return dateCompare;
      return (a.employee_name || '').localeCompare(b.employee_name || '');
    });
  };

  // Filter schedules
  const filteredSchedules = schedules ? processSchedules(schedules).filter(schedule => {
    if (!schedule) return false;
    
    const matchesPosition = selectedPosition === 'all' || schedule.position === selectedPosition;
    const matchesEmployee = !selectedEmployee || 
      (schedule.employee_name && schedule.employee_name.toLowerCase().includes(selectedEmployee.toLowerCase()));
    const matchesStatus = selectedStatus === 'all' || 
      (selectedStatus === 'on' && !schedule.is_off_schedule) || 
      (selectedStatus === 'off' && schedule.is_off_schedule);

    // Convert dates to comparable format
    const scheduleDate = schedule.date;
    const filterStartDate = new Date(startDate);
    const filterEndDate = new Date(endDate);
    
    // Check if schedule date is within filter range
    const isInDateRange = scheduleDate >= filterStartDate && scheduleDate <= filterEndDate;

    // Debug log for filtering
    console.log('Filtering schedule:', {
      schedule,
      matchesPosition,
      selectedPosition,
      schedulePosition: schedule.position,
      matchesEmployee,
      matchesStatus,
      isInDateRange
    });

    return matchesPosition && matchesEmployee && matchesStatus && isInDateRange;
  }) : [];

  // Debug log for filtered results
  useEffect(() => {
    console.log('Filtered schedules:', filteredSchedules);
  }, [filteredSchedules]);

  // Handle form changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Reset employee selection when position changes
    if (name === 'position') {
      setFormData(prev => ({ ...prev, employeeId: '' }));
      setSearchTerm('');
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      // Prepare the data in the format expected by the backend
      const scheduleData = {
        position: formData.position,
        start_date: formData.startDate,
        end_date: formData.endDate,
        employee_id: formData.employeeId,
        start_time: formData.startTime,
        end_time: formData.endTime,
        schedule_type: formData.schedule_type,
        notes: formData.notes,
      };
      
      await axios.post('http://localhost:5000/api/work-schedules', scheduleData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Schedule created successfully!');
      fetchSchedules();
      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Submit error:', error);
      setError('Failed to create schedule: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Auto generate schedules
  const handleAutoGenerate = async () => {
    try {
      setLoading(true);
      setError('');
      
      await axios.post('http://localhost:5000/api/work-schedules/auto-generate', {
        startDate: startDate,
        endDate: endDate
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Schedules auto-generated successfully!');
      fetchSchedules();
    } catch (error) {
      setError('Failed to auto-generate schedules: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      position: '',
      startDate: '',
      endDate: '',
      employeeId: '',
      startTime: '',
      endTime: '',
      schedule_type: '',
      notes: ''
    });
    setSearchTerm('');
  };

  // Handle delete schedule
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await axios.delete(`http://localhost:5000/api/work-schedules/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Schedule deleted successfully!');
      fetchSchedules();
    } catch (error) {
      setError('Failed to delete schedule: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add useEffect for pagination
  useEffect(() => {
    fetchSchedules();
  }, [currentPage, selectedPosition, selectedStatus]);

  // Handle edit schedule
  const handleEdit = (id) => {
    const schedule = schedules.find(s => s.id === id);
    if (schedule) {
      setFormData({
        position: schedule.position,
        startDate: format(new Date(schedule.date), 'yyyy-MM-dd'),
        endDate: format(new Date(schedule.date), 'yyyy-MM-dd'),
        employeeId: schedule.employee_id,
        startTime: schedule.start_time,
        endTime: schedule.end_time,
        schedule_type: schedule.schedule_type || '',
        notes: schedule.notes || '',
      });
      setSearchTerm(schedule.employee_name);
      setShowForm(true);
    }
  };

  // Add useEffect for debugging schedules state
  useEffect(() => {
    console.log('Current schedules state:', schedules);
  }, [schedules]);

  return (
    <div className="work-schedule-page">
      <NavigationBar onHamburgerClick={() => setShowSidebar(v => !v)} />
      <div className="content-wrapper">
        <Sidebar showSidebar={showSidebar} onCloseSidebar={() => setShowSidebar(false)} />
        <div className="main-content">
          <h1>Work Schedule Management</h1>
          <div className="filters-section">
            <div className="filters-row">
              <div className="filters-group">
                <div className="filter-item">
                  <label className="form-label">Position</label>
                  <select
                    className="form-select"
                    value={selectedPosition}
                    onChange={(e) => handleFilterChange({ target: { name: 'position', value: e.target.value } })}
                    name="position"
                  >
                    <option value="all">All Positions</option>
                    {positions && positions.length > 0 ? (
                      positions.map((position, index) => (
                        <option key={index} value={position}>
                          {position}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No positions available</option>
                    )}
                  </select>
                </div>
                
                <div className="filter-item">
                  <label className="form-label">From</label>
                  <input
                    type="date"
                    className="form-control"
                    value={format(startDate, 'yyyy-MM-dd')}
                    onChange={(e) => setStartDate(new Date(e.target.value))}
                  />
                </div>
                
                <div className="filter-item">
                  <label className="form-label">To</label>
                  <input
                    type="date"
                    className="form-control"
                    value={format(endDate, 'yyyy-MM-dd')}
                    onChange={(e) => setEndDate(new Date(e.target.value))}
                    min={format(startDate, 'yyyy-MM-dd')}
                  />
                </div>
                
                <div className="filter-item">
                  <label className="form-label">Employee</label>
                  <div className="employee-search-container">
                    <input
                      type="text"
                      className="form-control"
                      value={selectedEmployee}
                      onChange={(e) => handleFilterChange({ target: { name: 'employee', value: e.target.value } })}
                      name="employee"
                      placeholder="Search employee..."
                    />
                    {selectedEmployee && (
                      <div className="employee-search-dropdown">
                        {employees
                          .filter(emp => 
                            emp.name.toLowerCase().includes(selectedEmployee.toLowerCase()) &&
                            (selectedPosition === 'all' || emp.position === selectedPosition)
                          )
                          .map(emp => (
                            <div
                              key={emp.id}
                              className="employee-search-item"
                              onClick={() => {
                                setSelectedEmployee(emp.name);
                                handleFilterChange({
                                  target: { name: 'employee', value: emp.name }
                                });
                              }}
                            >
                              <div className="employee-name">{emp.name}</div>
                              <div className="employee-position">{emp.position}</div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="filter-item">
                  <label className="form-label">Status</label>
                  <select
                    className="form-select"
                    value={selectedStatus}
                    onChange={handleFilterChange}
                    name="status"
                  >
                    <option value="all">All Status</option>
                    <option value="on">On Schedule</option>
                    <option value="off">Off Schedule</option>
                  </select>
                </div>
              </div>
              
              <div className="action-buttons">
                <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                  Add Schedule
                </button>
                <button className="btn btn-secondary ms-2" onClick={handleAutoGenerate}>
                  Auto Generate
                </button>
              </div>
            </div>
          </div>
          
          {loading && <div className="loading-spinner">Loading...</div>}
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div className="table-responsive">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Employee ID</th>
                  <th>Position</th>
                  <th>Date</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Schedule Type</th>
                  <th>Notes</th>
                  <th>Created At</th>
                  <th>Updated At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSchedules.map((schedule, index) => (
                  <tr key={`${schedule.id}-${format(new Date(schedule.date), 'yyyy-MM-dd')}`}>
                    <td>{schedule.id}</td>
                    <td>{schedule.employee_id}</td>
                    <td>{schedule.position}</td>
                    <td>{format(new Date(schedule.date), 'yyyy-MM-dd')}</td>
                    <td>{schedule.start_time ? schedule.start_time.substring(0, 5) : '-'}</td>
                    <td>{schedule.end_time ? schedule.end_time.substring(0, 5) : '-'}</td>
                    <td>{schedule.schedule_type || '-'}</td>
                    <td>{schedule.notes || '-'}</td>
                    <td>{schedule.created_at ? format(new Date(schedule.created_at), 'yyyy-MM-dd HH:mm') : '-'}</td>
                    <td>{schedule.updated_at ? format(new Date(schedule.updated_at), 'yyyy-MM-dd HH:mm') : '-'}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-button edit-button"
                          onClick={() => handleEdit(schedule.id)}
                        >
                          Edit
                        </button>
                        <button 
                          className="action-button delete-button"
                          onClick={() => handleDelete(schedule.id)}
                        >
                          Delete
                        </button>
                      </div>
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

          {showForm && (
            <div className="form-container">
              <div className="modal show d-block">
                <div className="modal-dialog modal-lg">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Add New Schedule</h5>
                      <button type="button" className="btn-close" onClick={() => setShowForm(false)}></button>
                    </div>
                    <div className="modal-body">
                      <form onSubmit={handleSubmit}>
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Position</label>
                            <select
                              className="form-select"
                              name="position"
                              value={formData.position}
                              onChange={handleChange}
                              required
                            >
                              <option value="">Select Position</option>
                              {positions && positions.length > 0 ? (
                                positions.map((position, index) => (
                                  <option key={index} value={position}>
                                    {position}
                                  </option>
                                ))
                              ) : (
                                <option value="" disabled>No positions available</option>
                              )}
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">Schedule Type</label>
                            <select
                              className="form-select"
                              name="schedule_type"
                              value={formData.schedule_type}
                              onChange={handleChange}
                              required
                            >
                              <option value="">Select Type</option>
                              <option value="Work">Work</option>
                              <option value="Off Day">Off Day</option>
                              <option value="Training">Training</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label className="form-label">Start Date</label>
                            <input
                              type="date"
                              className="form-control"
                              name="startDate"
                              value={formData.startDate}
                              onChange={handleChange}
                              required
                            />
                          </div>
                          <div className="col-md-6">
                            <label className="form-label">End Date</label>
                            <input
                              type="date"
                              className="form-control"
                              name="endDate"
                              value={formData.endDate}
                              onChange={handleChange}
                              required
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Select Employee</label>
                          <div className="employee-select-container">
                            <input
                              type="text"
                              className="form-control mb-2"
                              placeholder="Type to search employee..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              disabled={!formData.position}
                            />
                            <div className="employee-list">
                              {formData.position && (
                                employees.length > 0 ? (
                                  employees
                                    .filter(employee => 
                                      employee.position === formData.position && 
                                      employee.name.toLowerCase().includes(searchTerm.toLowerCase())
                                    )
                                    .map(employee => (
                                      <div
                                        key={employee.id}
                                        className={`employee-list-item ${formData.employeeId === employee.id ? 'selected' : ''}`}
                                        onClick={() => {
                                          setFormData(prev => ({
                                            ...prev,
                                            employeeId: employee.id
                                          }));
                                          setSearchTerm(employee.name);
                                        }}
                                      >
                                        <div className="employee-name">{employee.name}</div>
                                        <div className="employee-position">{employee.position}</div>
                                      </div>
                                    ))
                                ) : (
                                  <div className="no-employees">No employees found for this position</div>
                                )
                              )}
                            </div>
                            {formData.employeeId && employees.find(emp => emp.id === formData.employeeId) && (
                              <div className="selected-employee-name mt-2">
                                Selected: {employees.find(emp => emp.id === formData.employeeId).name}
                              </div>
                            )}
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
                              required={formData.schedule_type === 'Work' || formData.schedule_type === 'Training'}
                              disabled={formData.schedule_type === 'Off Day'}
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
                              required={formData.schedule_type === 'Work' || formData.schedule_type === 'Training'}
                              disabled={formData.schedule_type === 'Off Day'}
                            />
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label">Notes</label>
                          <textarea
                            className="form-control"
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows="3"
                          ></textarea>
                        </div>

                        <div className="modal-footer">
                          <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                            Cancel
                          </button>
                          <button type="submit" className="btn btn-primary" disabled={loading}>
                            Save Schedule
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkSchedulePage; 