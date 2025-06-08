import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../components/Sidebar';
import '../styles/EmployeeManagement.css';
import '../styles/Dashboard.css';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [supervisorMap, setSupervisorMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    supervisor_id: ''
  });
  const [userFormData, setUserFormData] = useState({
    username: '',
    password: '',
    role: 'EMPLOYEE',
    supervisor_id: '',
    employeeDetails: {
      name: '',
      position: '',
      department: ''
    }
  });
  const [showSidebar, setShowSidebar] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // New state for filters
  const [filterRole, setFilterRole] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');

  const token = useSelector(state => state.auth.token);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/employees', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (Array.isArray(response.data)) {
        // Filter for valid employee objects with an 'id' and 'name' property
        const validEmployees = response.data.filter(emp => 
          emp && typeof emp === 'object' && emp.id !== undefined && emp.id !== null && 
          (typeof emp.name === 'string' || emp.name === null) // Allow name to be null, but not undefined object
        );
        setEmployees(validEmployees);

        const map = {};
        validEmployees.forEach(emp => {
          map[emp.id] = emp.name || '[Nama Tidak Tersedia]';
        });
        setSupervisorMap(map);
      } else {
        console.warn('API did not return an array for employees:', response.data);
        setEmployees([]);
        setSupervisorMap({});
      }
      setLoading(false);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to fetch employees: ' + (err.response?.data?.message || err.message));
      setEmployees([]);
      setSupervisorMap({});
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/employees', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      setFormData({ name: '', position: '', department: '', supervisor_id: '' });
      fetchEmployees();
    } catch (err) {
      setError('Failed to add employee');
    }
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/employees/${selectedEmployee.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowEditModal(false);
      setFormData({ name: '', position: '', department: '', supervisor_id: '' });
      fetchEmployees();
    } catch (err) {
      setError('Failed to update employee');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await axios.delete(`http://localhost:5000/api/employees/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchEmployees();
      } catch (err) {
        setError('Failed to delete employee');
      }
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      // Register user
      const registerResponse = await axios.post('http://localhost:5000/api/auth/register-user', {
        username: userFormData.username,
        password: userFormData.password,
        role: userFormData.role
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (registerResponse.data.user) {
        // Create employee record
        await axios.post('http://localhost:5000/api/employees', {
          user_id: registerResponse.data.user.id,
          name: userFormData.employeeDetails.name,
          position: userFormData.employeeDetails.position,
          department: userFormData.employeeDetails.department,
          supervisor_id: userFormData.supervisor_id || null
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setShowAddUserModal(false);
        setUserFormData({
          username: '',
          password: '',
          role: 'EMPLOYEE',
          supervisor_id: '',
          employeeDetails: {
            name: '',
            position: '',
            department: ''
          }
        });
        fetchEmployees();
      }
    } catch (err) {
      setError(`Failed to add user: ${err.response?.data?.message || err.message}`);
    }
  };

  if (loading) return <div className="dashboard"><NavigationBar onHamburgerClick={() => setShowSidebar(v => !v)} /><div className="dashboard-content"><Sidebar showSidebar={showSidebar} onCloseSidebar={() => setShowSidebar(false)} /><main className="main-content"><div className="container">Loading...</div></main></div></div>;

  return (
    <div className="dashboard">
      <NavigationBar onHamburgerClick={() => setShowSidebar(v => !v)} />
      
      <div className="dashboard-content">
        <Sidebar showSidebar={showSidebar} onCloseSidebar={() => setShowSidebar(false)} />

        <main className="main-content">
          <div className="container">
            <div className="header">
              <h1>Employee Management</h1>
              <div className="header-buttons">
                {/* <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                  Add Employee
                </button> */}
                <button className="btn btn-primary" onClick={() => setShowAddUserModal(true)}>
                  <i className="bi bi-plus-lg"></i> Add New User Account
                </button>
              </div>
            </div>

            {/* Filter Section */}
            <div className="filter-section">
              <div className="form-group">
                <label htmlFor="filterRole">Filter by Role</label>
                <select
                  id="filterRole"
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                >
                  <option value="">All Roles</option>
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="PIC">PIC</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="filterPosition">Filter by Position</label>
                <select
                  id="filterPosition"
                  value={filterPosition}
                  onChange={(e) => setFilterPosition(e.target.value)}
                >
                  <option value="">All Positions</option>
                  {[ 'Content Creator', 'Customer Service', 'Host Live Streaming', 'KOL Specialist', 'Office Boy', 'Operator Live Streaming', 'Operator Store', 'PIC CS', 'Test'].sort().map(position => (
                    <option key={position} value={position}>{position}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="filterDepartment">Filter by Department</label>
                <select
                  id="filterDepartment"
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {[ 'Customer Service', 'HR/GA', 'Live Streaming', 'Test'].sort().map(department => (
                    <option key={department} value={department}>{department}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <table className="employee-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Position</th>
                  <th>Department</th>
                  <th>Supervisor</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(employees && Array.isArray(employees) ? employees : [])
                  .filter(employee => typeof employee === 'object' && employee !== null)
                  .filter(employee => {
                    // Apply filters based on selected values
                    if (filterRole && employee?.role !== filterRole) return false;
                    if (filterPosition && employee?.position !== filterPosition) return false;
                    if (filterDepartment && employee?.department !== filterDepartment) return false;
                    return true;
                  })
                  .sort((a, b) => {
                    // Prioritize 'Test' position
                    const isATest = a?.position === 'Test';
                    const isBTest = b?.position === 'Test';

                    if (isATest && !isBTest) return -1; // A (Test) comes before B (not Test)
                    if (!isATest && isBTest) return 1;  // B (Test) comes before A (not Test)

                    // If both or neither are Test, sort by name
                    const nameA = a?.name || '';
                    const nameB = b?.name || '';
                    return nameA.localeCompare(nameB);
                  })
                  .map((employee, index) => (
                  <tr key={employee?.id || `emp-${Math.random()}`}>
                    <td>{index + 1}</td>
                    <td>{employee?.name || '[Nama Tidak Tersedia]'}</td>
                    <td>{employee?.username}</td>
                    <td>{employee?.role}</td>
                    <td>{employee?.position}</td>
                    <td>{employee?.department}</td>
                    <td>{employee?.supervisor_id ? supervisorMap[employee.supervisor_id] || '-' : '-'}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setFormData({
                            name: employee?.name || '',
                            position: employee?.position || '',
                            department: employee?.department || '',
                            supervisor_id: employee?.supervisor_id || ''
                          });
                          setShowEditModal(true);
                        }}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-delete"
                        onClick={() => handleDeleteEmployee(employee?.id)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add Employee Modal */}
            {/* {showAddModal && (
              <div className="modal">
                ...
              </div>
            )} */}

            {/* Edit Employee Modal */}
            {showEditModal && (
              <div className="modal" style={{
                display: showEditModal ? 'flex' : 'none',
                zIndex: 1050, /* A common z-index for modals */
                position: 'fixed', /* Ensure it's positioned relative to the viewport */
                top: 0,
                left: 250, /* Adjust based on sidebar width */
                width: 'calc(100% - 250px)', /* Adjust based on sidebar width */
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)', /* Add backdrop */
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <div className="modal-content">
                  <h2>Edit Employee</h2>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowEditModal(false)}></button>
                  <form onSubmit={handleEditEmployee}>
                    <div className="form-group">
                      <label htmlFor="editName">Name</label>
                      <input
                        id="editName"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="editPosition">Position</label>
                      <select
                        id="editPosition"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        required
                      >
                        <option value="">Select Position</option>
                        {[ 'Content Creator', 'Customer Service', 'Host Live Streaming', 'KOL Specialist', 'Office Boy', 'Operator Live Streaming', 'Operator Store', 'PIC CS', 'Test'].sort().map(position => (
                          <option key={position} value={position}>{position}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="editDepartment">Department</label>
                      <select
                        id="editDepartment"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        required
                      >
                        <option value="">Select Department</option>
                        {[ 'Customer Service', 'HR/GA', 'Live Streaming', 'Test'].sort().map(department => (
                          <option key={department} value={department}>{department}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="editSupervisor">Supervisor</label>
                      <select
                        id="editSupervisor"
                        value={formData.supervisor_id}
                        onChange={e => setFormData({ ...formData, supervisor_id: e.target.value })}
                      >
                        <option value="">None</option>
                        {(employees && Array.isArray(employees) ? employees : [])
                          .filter(employee => typeof employee === 'object' && employee !== null && employee?.role === 'PIC')
                          .sort((a, b) => {
                            // Prioritize 'Test' position
                            const isATest = a?.position === 'Test';
                            const isBTest = b?.position === 'Test';

                            if (isATest && !isBTest) return -1; // A (Test) comes before B (not Test)
                            if (!isATest && isBTest) return 1;  // B (Test) comes before A (not Test)

                            // If both or neither are Test, sort by name
                            const nameA = a?.name || '';
                            const nameB = b?.name || '';
                            return nameA.localeCompare(nameB);
                          })
                          .map(emp => (
                          <option key={emp?.id || `sup-${Math.random()}`} value={emp?.id}>{emp?.name || '[Nama Tidak Tersedia]'}</option>
                        ))}
                      </select>
                    </div>
                    <div className="modal-actions">
                      <button type="submit" className="btn btn-primary">Update</button>
                      <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Add User Modal */}
            {showAddUserModal && (
              <div className="modal" style={{
                display: showAddUserModal ? 'flex' : 'none',
                zIndex: 1050,
                position: 'fixed',
                top: 0,
                left: 250,
                width: 'calc(100% - 250px)',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <div className="modal-content">
                  <h2>Add New User Account</h2>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowAddUserModal(false)}></button>
                  <form onSubmit={handleAddUser}>
                    <div className="form-group">
                      <label htmlFor="username">Username</label>
                      <input
                        id="username"
                        type="text"
                        value={userFormData.username}
                        onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group password-group">
                      <label htmlFor="password">Password</label>
                      <div className="input-with-icon">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={userFormData.password}
                          onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                          required
                        />
                        <button
                          type="button"
                          className="password-toggle-btn"
                          onClick={() => setShowPassword(prev => !prev)}
                        >
                          <i className={`bi ${showPassword ? 'bi-eye' : 'bi-eye-slash'}`}></i>
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="role">Role</label>
                      <select
                        id="role"
                        value={userFormData.role}
                        onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                        required
                      >
                        <option value="EMPLOYEE">EMPLOYEE</option>
                        <option value="PIC">PIC</option>
                      </select>
                    </div>
                    <hr /> {/* Separator for employee details */}
                    <h3>Employee Details</h3>
                    <div className="form-group">
                      <label htmlFor="employeeName">Name</label>
                      <input
                        id="employeeName"
                        type="text"
                        value={userFormData.employeeDetails.name}
                        onChange={(e) => setUserFormData(prevFormData => ({ ...prevFormData, employeeDetails: { ...prevFormData.employeeDetails, name: e.target.value } }))}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="employeePosition">Position</label>
                      <select
                        id="employeePosition"
                        value={userFormData.employeeDetails.position}
                        onChange={(e) => {
                          const newPosition = e.target.value;
                          let newDepartment = userFormData.employeeDetails.department;
                          let newSupervisorId = '';

                          // Department Auto-fill Logic
                          if (['Host Live Streaming', 'Content Creator', 'KOL Specialist', 'Operator Live Streaming', 'Operator Store'].includes(newPosition)) {
                            newDepartment = 'Live Streaming';
                          } else if (['Customer Service', 'PIC CS'].includes(newPosition)) {
                            newDepartment = 'Customer Service';
                          } else {
                            newDepartment = ''; // Reset if no match
                          }

                          // Supervisor Auto-fill Logic
                          if (newPosition === 'Host Live Streaming') {
                            const operatorLiveStreaming = employees.find(emp => emp?.role === 'PIC' && emp?.position === 'Operator Live Streaming');
                            newSupervisorId = operatorLiveStreaming?.id || '';
                          } else if (['Content Creator', 'KOL Specialist', 'Operator Live Streaming'].includes(newPosition)) {
                            const operatorStore = employees.find(emp => emp?.role === 'PIC' && emp?.position === 'Operator Store');
                            newSupervisorId = operatorStore?.id || '';
                          } else if (newPosition === 'Customer Service') {
                            const picCS = employees.find(emp => emp?.role === 'PIC' && emp?.position === 'PIC CS');
                            newSupervisorId = picCS?.id || '';
                          }

                          setUserFormData(prevFormData => ({
                            ...prevFormData,
                            employeeDetails: { ...prevFormData.employeeDetails, position: newPosition, department: newDepartment },
                            supervisor_id: newSupervisorId,
                          }));
                        }}
                        required
                      >
                        <option value="">Select Position</option>
                        {[ 'Content Creator', 'Customer Service', 'Host Live Streaming', 'KOL Specialist', 'Office Boy', 'Operator Live Streaming', 'Operator Store', 'PIC CS', 'Test'].sort().map(position => (
                          <option key={position} value={position}>{position}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="employeeDepartment">Department</label>
                      <select
                        id="employeeDepartment"
                        value={userFormData.employeeDetails.department}
                        onChange={(e) => setUserFormData(prevFormData => ({ ...prevFormData, employeeDetails: { ...prevFormData.employeeDetails, department: e.target.value } }))}
                        required
                      >
                        <option value="">Select Department</option>
                        {[ 'Customer Service', 'HR/GA', 'Live Streaming', 'Test'].sort().map(department => (
                          <option key={department} value={department}>{department}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="employeeSupervisor">Supervisor (Optional)</label>
                      <select
                        id="employeeSupervisor"
                        value={userFormData.supervisor_id}
                        onChange={(e) => setUserFormData({ ...userFormData, supervisor_id: e.target.value })}
                      >
                        <option value="">None</option>
                        {(employees && Array.isArray(employees) ? employees : [])
                          .filter(employee => typeof employee === 'object' && employee !== null && employee?.role === 'PIC')
                          .sort((a, b) => {
                            // Prioritize 'Test' position
                            const isATest = a?.position === 'Test';
                            const isBTest = b?.position === 'Test';

                            if (isATest && !isBTest) return -1; // A (Test) comes before B (not Test)
                            if (!isATest && isBTest) return 1;  // B (Test) comes before A (not Test)

                            // If both or neither are Test, sort by name
                            const nameA = a?.name || '';
                            const nameB = b?.name || '';
                            return nameA.localeCompare(nameB);
                          })
                          .map(emp => (
                          <option key={emp?.id || `sup-${Math.random()}`} value={emp?.id}>{emp?.name || '[Nama Tidak Tersedia]'}</option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary btn-md me-2">Add User</button>
                    <button type="button" className="btn btn-secondary btn-md" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeeManagement; 