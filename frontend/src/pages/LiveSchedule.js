import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format, addDays } from 'date-fns';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../components/Sidebar';
import '../styles/Dashboard.css'; // Keep for main layout classes like .dashboard, .main-content
import '../styles/WorkSchedulePage.css'; // Import styles from work schedule page
import Select from 'react-select';

const LiveSchedule = () => {
    // State untuk filter
    const [accounts, setAccounts] = useState([]);
    const [selectedAccounts, setSelectedAccounts] = useState([]);
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [schedules, setSchedules] = useState([]);
    const [showDraft, setShowDraft] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [currentBatchId, setCurrentBatchId] = useState(null);
    const [showSidebar, setShowSidebar] = useState(false);

    // State untuk searchable multi-select Live Account
    const [accountSearchTerm, setAccountSearchTerm] = useState('');
    const [filteredAccounts, setFilteredAccounts] = useState([]);
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);

    // State untuk modal
    const [showModal, setShowModal] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [modalTitle, setModalTitle] = useState('');

    // State untuk form input data
    const [formData, setFormData] = useState({
        liveAccount: {
            account_name: '',
            account_code: '',
            platform: '',
            location: '',
            start_time: '',
            end_time: '',
            duration: '',
            slot_qty: '',
            switch_host_every: '',
            total_host_by_day: '',
            with_cohost: false
        },
        host: {
            name: '',
            email: '',
            phone: '',
            status: 'active'
        },
        hostAssignment: {
            host_id: '',
            account_id: ''
        },
        hostAvailability: {
            host_id: '',
            date: '',
            is_available: true,
            start_time: '',
            end_time: ''
        },
        scheduleConfig: {
            account_id: '',
            min_hosts_per_day: '',
            max_hosts_per_day: '',
            preferred_start_time: '',
            preferred_end_time: ''
        },
        scheduleBatch: {
            start_date: '',
            end_date: '',
            status: 'draft'
        }
    });

    // State untuk validasi
    const [validationResults, setValidationResults] = useState({
        accountCoverage: false,
        hostMinHours: false,
        hostMaxHours: false,
        standbyHours: false
    });

    // Fetch live accounts
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                setLoading(true);
                const response = await axios.get('http://localhost:5000/api/live-accounts', {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                if (response.data && response.data.success) {
                    setAccounts(response.data.data);
                    setFilteredAccounts(response.data.data);
                } else {
                    setError('Invalid response format from server');
                }
            } catch (err) {
                console.error('Failed to fetch live accounts:', err);
                setError(err.response?.data?.message || 'Failed to fetch live accounts');
            } finally {
                setLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    // Filter accounts based on search term
    useEffect(() => {
        if (accountSearchTerm === '') {
            setFilteredAccounts(accounts);
        } else {
            setFilteredAccounts(
                accounts.filter(account =>
                    account.account_name.toLowerCase().includes(accountSearchTerm.toLowerCase())
                )
            );
        }
    }, [accountSearchTerm, accounts]);

    // Handle selecting an account from the dropdown
    const handleSelectAccount = (account) => {
        if (!selectedAccounts.some(acc => acc.id === account.id)) {
            setSelectedAccounts(prev => [...prev, account]);
        }
        setAccountSearchTerm('');
        setShowAccountDropdown(false);
    };

    // Handle removing a selected account tag
    const handleRemoveAccount = (accountId) => {
        setSelectedAccounts(prev => prev.filter(acc => acc.id !== accountId));
    };

    // Handle form input changes
    const handleInputChange = (section, field, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    // Handle modal open
    const handleOpenModal = (step) => {
        setCurrentStep(step);
        switch(step) {
            case 1:
                setModalTitle('Input Live Account');
                break;
            case 2:
                setModalTitle('Input Host');
                break;
            case 3:
                setModalTitle('Input Host Account Assignment');
                break;
            case 4:
                setModalTitle('Input Host Availability');
                break;
            case 5:
                setModalTitle('Input Schedule Configuration');
                break;
            case 6:
                setModalTitle('Create Schedule Batch');
                break;
            default:
                setModalTitle('');
        }
        setShowModal(true);
    };

    // Handle form submissions
    const handleSubmit = async (section) => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');

            let endpoint = '';
            let data = {};

            switch(section) {
                case 'liveAccount':
                    endpoint = '/api/live-accounts';
                    data = formData.liveAccount;
                    break;
                case 'host':
                    endpoint = '/api/hosts';
                    data = formData.host;
                    break;
                case 'hostAssignment':
                    endpoint = '/api/host-account-assignments';
                    data = formData.hostAssignment;
                    break;
                case 'hostAvailability':
                    endpoint = '/api/host-availability';
                    data = formData.hostAvailability;
                    break;
                case 'scheduleConfig':
                    endpoint = '/api/schedule-config';
                    data = formData.scheduleConfig;
                    break;
                case 'scheduleBatch':
                    endpoint = '/api/schedule-batches';
                    data = formData.scheduleBatch;
                    break;
                default:
                    throw new Error('Invalid section');
            }

            const response = await axios.post(`http://localhost:5000${endpoint}`, data, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.success) {
                setSuccess(`${section} data saved successfully`);
                setShowModal(false);
                // Reset form data for that section
                setFormData(prev => ({
                    ...prev,
                    [section]: {}
                }));
            }
        } catch (err) {
            console.error(`Failed to save ${section}:`, err);
            setError(err.response?.data?.message || `Failed to save ${section}`);
        } finally {
            setLoading(false);
        }
    };

    // Fetch schedules
    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:5000/api/live-schedules');
            if (response.data && response.data.success) {
                // console.log('DEBUG: Raw schedules data from backend:', response.data.data); // Removed debug log
                setSchedules(response.data.data);
                // validateSchedules(response.data.data); // Temporarily comment out
            }
        } catch (err) {
            setError('Failed to fetch schedules');
        } finally {
            setLoading(false);
        }
    };

    // Validate schedules
    const validateSchedules = (scheduleData) => {
        // Temporarily commented out all validation logic to isolate RangeError
        // console.log('DEBUG: validateSchedules called with data:', scheduleData);
        
        const validation = {
            accountCoverage: true,
            hostMinHours: true,
            hostMaxHours: true,
            standbyHours: true
        };

        const hostSchedules = {};
        scheduleData.forEach(schedule => {
            if (!schedule || !schedule.host_id) { 
                // console.warn('Skipping invalid schedule entry:', schedule); // Removed debug log
                return;
            }
            if (!hostSchedules[schedule.host_id]) {
                hostSchedules[schedule.host_id] = [];
            }
            hostSchedules[schedule.host_id].push(schedule);
        });

        Object.values(hostSchedules).forEach(schedules => {
            let totalLiveHours = 0;
            let firstSlot = null;
            let lastSlot = null;

            schedules.forEach(schedule => {
                console.log('DEBUG: Processing schedule:', schedule); // New log

                const [startHour, startMinute, startSecond] = (schedule.start_time || '00:00:00').split(':').map(Number);
                console.log('DEBUG: Parsed start time components (raw):', { startHour, startMinute, startSecond }); // New log

                if (isNaN(startHour) || startHour < 0 || startHour > 23 ||
                    isNaN(startMinute) || startMinute < 0 || startMinute > 59 ||
                    isNaN(startSecond) || startSecond < 0 || startSecond > 59) {
                    console.error('Error: Invalid start time components for schedule:', schedule);
                    return; 
                }

                const [endHour, endMinute, endSecond] = (schedule.end_time || '00:00:00').split(':').map(Number);
                console.log('DEBUG: Parsed end time components (raw):', { endHour, endMinute, endSecond }); // New log

                if (isNaN(endHour) || endHour < 0 || endHour > 23 ||
                    isNaN(endMinute) || endMinute < 0 || endMinute > 59 ||
                    isNaN(endSecond) || endSecond < 0 || endSecond > 59) {
                    console.error('Error: Invalid end time components for schedule:', schedule);
                    return; 
                }

                const startTotalMinutes = startHour * 60 + startMinute + startSecond / 60;
                const endTotalMinutes = endHour * 60 + endMinute + endSecond / 60;

                const hours = (endTotalMinutes - startTotalMinutes) / 60;

                totalLiveHours += hours;

                let firstSlotTime, lastSlotTime;
                try {
                    firstSlotTime = new Date(2000, 0, 1, startHour, startMinute, startSecond);
                    lastSlotTime = new Date(2000, 0, 1, endHour, endMinute, endSecond);
                    console.log('DEBUG: Created Date objects:', { firstSlotTime, lastSlotTime }); // New log
                } catch (dateError) {
                    console.error('Unexpected error creating Date object for slot comparison:', dateError, 'for schedule:', schedule);
                    return; 
                }
                
                if (!firstSlot || firstSlotTime < firstSlot) {
                    firstSlot = firstSlotTime;
                }
                if (!lastSlot || lastSlotTime > lastSlot) {
                    lastSlot = lastSlotTime;
                }
            });

            if (totalLiveHours < 4) {
                validation.hostMinHours = false;
            }

            if (totalLiveHours > 6) {
                validation.hostMaxHours = false;
            }

            if (lastSlot && firstSlot) {
                const standbyHours = (lastSlot - firstSlot) / (1000 * 60 * 60);
                if (standbyHours > 10) {
                    validation.standbyHours = false;
                }
            }
        });

        setValidationResults(validation);
    };

    // Handle auto generate schedule
    const handleGenerateSchedule = async () => {
        if (selectedAccounts.length === 0) {
            setError('Please select at least one account');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const response = await axios.post('http://localhost:5000/api/live-schedules/auto-generate', {
                account_ids: selectedAccounts.map(acc => Number(acc.value)),
                start_date: startDate
            });

            if (response.data && response.data.success) {
                setSuccess('Schedule generated successfully');
                fetchSchedules();
            }
        } catch (err) {
            console.error('Failed to generate schedule:', err);
            setError(err.response?.data?.message || 'Failed to generate schedule');
        } finally {
            setLoading(false);
        }
    };

    // Handle download Excel
    const handleDownloadExcel = async () => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');

            // Implementasi untuk mengunduh Excel
            console.log('Downloading Excel...');

            // Example: Make an API call to your backend's /download-excel endpoint
            // const response = await axios.get('http://localhost:5000/api/live-schedules/download-excel', {
            //     responseType: 'blob', // Important for binary data like Excel files
            // });

            // if (response.data) {
            //     const url = window.URL.createObjectURL(new Blob([response.data]));
            //     const link = document.createElement('a');
            //     link.href = url;
            //     link.setAttribute('download', `Live_Schedules_${startDate}.xlsx`); // Or use a dynamic name
            //     document.body.appendChild(link);
            //     link.click();
            //     link.parentNode.removeChild(link);
            //     setSuccess('Excel file downloaded successfully!');
            // } else {
            //     setError('Failed to download Excel file.');
            // }

        } catch (err) {
            console.error('Failed to download Excel:', err);
            setError(err.response?.data?.message || 'Failed to download Excel');
        } finally {
            setLoading(false);
        }
    };

    // Handle edit schedule
    const handleEditSchedule = (schedule) => {
        console.log('Edit schedule:', schedule);
        // Implement edit logic later
    };

    // Handle delete schedule
    const handleDeleteSchedule = async (scheduleId) => {
        if (!window.confirm('Are you sure you want to delete this schedule?')) {
            return;
        }
        console.log('Delete schedule:', scheduleId);
        // Implement delete logic later
    };

    // Trigger fetch schedules when selectedAccounts or startDate changes
    useEffect(() => {
        fetchSchedules();
    }, [selectedAccounts, startDate]);

    // Render modal content based on current step
    const renderModalContent = () => {
        switch(currentStep) {
            case 1:
                return (
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Account Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.liveAccount.account_name}
                                    onChange={(e) => handleInputChange('liveAccount', 'account_name', e.target.value)}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Account Code</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.liveAccount.account_code}
                                    onChange={(e) => handleInputChange('liveAccount', 'account_code', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="text-end">
                            <button
                                className="btn btn-primary"
                                onClick={() => handleSubmit('liveAccount')}
                            >
                                Save Live Account
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.host.name}
                                    onChange={(e) => handleInputChange('host', 'name', e.target.value)}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    value={formData.host.email}
                                    onChange={(e) => handleInputChange('host', 'email', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="text-end">
                            <button
                                className="btn btn-primary"
                                onClick={() => handleSubmit('host')}
                            >
                                Save Host
                            </button>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Host</label>
                                <select
                                    className="form-select"
                                    value={formData.hostAssignment.host_id}
                                    onChange={(e) => handleInputChange('hostAssignment', 'host_id', e.target.value)}
                                >
                                    <option value="">Select Host</option>
                                    {/* Add host options here */}
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Account</label>
                                <select
                                    className="form-select"
                                    value={formData.hostAssignment.account_id}
                                    onChange={(e) => handleInputChange('hostAssignment', 'account_id', e.target.value)}
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.account_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="text-end">
                            <button
                                className="btn btn-primary"
                                onClick={() => handleSubmit('hostAssignment')}
                            >
                                Save Assignment
                            </button>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Host</label>
                                <select
                                    className="form-select"
                                    value={formData.hostAvailability.host_id}
                                    onChange={(e) => handleInputChange('hostAvailability', 'host_id', e.target.value)}
                                >
                                    <option value="">Select Host</option>
                                    {/* Add host options here */}
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData.hostAvailability.date}
                                    onChange={(e) => handleInputChange('hostAvailability', 'date', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="text-end">
                            <button
                                className="btn btn-primary"
                                onClick={() => handleSubmit('hostAvailability')}
                            >
                                Save Availability
                            </button>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Account</label>
                                <select
                                    className="form-select"
                                    value={formData.scheduleConfig.account_id}
                                    onChange={(e) => handleInputChange('scheduleConfig', 'account_id', e.target.value)}
                                >
                                    <option value="">Select Account</option>
                                    {accounts.map((account) => (
                                        <option key={account.id} value={account.id}>
                                            {account.account_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Min Hosts Per Day</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={formData.scheduleConfig.min_hosts_per_day}
                                    onChange={(e) => handleInputChange('scheduleConfig', 'min_hosts_per_day', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="text-end">
                            <button
                                className="btn btn-primary"
                                onClick={() => handleSubmit('scheduleConfig')}
                            >
                                Save Configuration
                            </button>
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData.scheduleBatch.start_date}
                                    onChange={(e) => handleInputChange('scheduleBatch', 'start_date', e.target.value)}
                                />
                            </div>
                            <div className="col-md-6 mb-3">
                                <label className="form-label">End Date</label>
                                <input
                                    type="date"
                                    className="form-control"
                                    value={formData.scheduleBatch.end_date}
                                    onChange={(e) => handleInputChange('scheduleBatch', 'end_date', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="text-end">
                            <button
                                className="btn btn-primary"
                                onClick={() => handleSubmit('scheduleBatch')}
                            >
                                Save Batch
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const accountOptions = accounts.map(acc => ({ value: acc.id, label: acc.account_name }));

    return (
        <div className="dashboard"> {/* Use the main layout div */}
            <NavigationBar onHamburgerClick={() => setShowSidebar(v => !v)} /> {/* Include NavigationBar */}
            <div className="content-wrapper"> {/* Use the content wrapper div */}
                <Sidebar showSidebar={showSidebar} onCloseSidebar={() => setShowSidebar(false)} /> {/* Include Sidebar */}
                <div className="main-content"> {/* Use the main content div */}
                    <h1>Live Schedule Management</h1> {/* Title */}

                     {/* Error and Success Messages */}
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}
                    {success && (
                         <div className="alert alert-success" role="alert">
                            {success}
                         </div>
                    )}

                     {/* Filter Section */}
                    <div className="mb-4">
                        <div className="row align-items-end mb-3">
                            {/* Live Account */}
                            <div className="col-md-4">
                                <label htmlFor="liveAccountFilter" className="form-label">Live Account</label>
                                <Select
                                    isMulti
                                    isSearchable
                                    options={accountOptions}
                                    value={selectedAccounts}
                                    onChange={selected => setSelectedAccounts(selected || [])}
                                    placeholder="Select Account..."
                                    classNamePrefix="react-select"
                                    closeMenuOnSelect={false}
                                />
                            </div>
                            {/* Start Date */}
                            <div className="col-md-2">
                                <label htmlFor="startDateFilter" className="form-label">Start Date</label>
                                <input
                                    type="date"
                                    id="startDateFilter"
                                    className="form-control"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            {/* Tombol */}
                            <div className="col-md-6 d-grid gap-2 d-md-flex justify-content-md-end">
                                <button
                                    className="btn btn-primary me-md-2"
                                    onClick={handleGenerateSchedule}
                                    disabled={loading}
                                >
                                    {loading ? 'Generating...' : 'Auto Generate Schedule'}
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleDownloadExcel}
                                    disabled={loading}
                                >
                                    Download Excel
                                </button>
                            </div>
                        </div>
                    </div>

                     {/* Loading Indicator */}
                    {loading && <div className="loading-spinner">Loading schedules...</div>} {/* Simple loading spinner style */}

                     {/* Validation Results */}
                    <div className="validation-section">
                        <h3>Schedule Validation:</h3>
                        <ul>
                            <li className={validationResults.accountCoverage ? 'valid' : 'invalid'}>
                                All accounts have hosts for each active slot
                            </li>
                            <li className={validationResults.hostMinHours ? 'valid' : 'invalid'}>
                                All hosts have minimum 4 hours live time
                            </li>
                            <li className={validationResults.hostMaxHours ? 'valid' : 'invalid'}>
                                No host exceeds 6 hours live time
                            </li>
                            <li className={validationResults.standbyHours ? 'valid' : 'invalid'}>
                                No host exceeds 10 hours standby time
                            </li>
                        </ul>
                    </div>

                     {/* Schedules Table */}
                    {schedules.length > 0 && (
                         <div className="schedules-section"> {/* Or use a different class if needed */}
                             <div className="table-responsive"> {/* Bootstrap class for responsive table */}
                                <table className="schedule-table"> {/* Reusing schedule-table class */}
                                    <thead>
                                        <tr>
                                            <th>No.</th>
                                            <th>Date</th>
                                            <th>Account Name</th>
                                            <th>Time</th>
                                            <th>Host</th>
                                            <th>Co-host</th>
                                            <th>Off</th>
                                            <th>Is Draft</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schedules.length > 0 ? (
                                          schedules
                                            .filter(schedule => showDraft ? true : !schedule.is_draft) // Filter by draft status
                                            .map((schedule, index) => (
                                              <tr key={schedule.schedule_id}>
                                                <td>{index + 1}</td>
                                                <td>
                                                  {schedule.schedule_date
                                                    ? (() => {
                                                        try {
                                                          const dateObj = new Date(schedule.schedule_date);
                                                          return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString();
                                                        } catch (e) {
                                                          console.error("Error parsing schedule_date for display:", e, schedule.schedule_date);
                                                          return '-';
                                                        }
                                                      })()
                                                    : '-'}
                                                </td>
                                                <td>{schedule.account_name}</td>
                                                <td>{`${schedule.start_time ? schedule.start_time.substring(0, 5) : '-'} - ${schedule.end_time ? schedule.end_time.substring(0, 5) : '-'}`}</td>
                                                <td>{schedule.host_name || '-'}</td>
                                                <td>{schedule.cohost_name || '-'}</td>
                                                <td>{schedule.off_availability_id ? 'Yes' : 'No'}</td>
                                                <td>{schedule.is_draft ? 'Yes' : 'No'}</td>
                                                <td>
                                                  {/* Actions */}
                                                  <button
                                                    className="btn btn-sm btn-info me-2"
                                                    onClick={() => handleEditSchedule(schedule)}
                                                  >
                                                    <i className="bi bi-pencil"></i>
                                                  </button>
                                                  <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDeleteSchedule(schedule.schedule_id)}
                                                  >
                                                    <i className="bi bi-trash"></i>
                                                  </button>
                                                </td>
                                              </tr>
                                            ))
                                        ) : (
                                          <tr>
                                            <td colSpan="9" className="text-center">No schedules found.</td>
                                          </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                             {/* Save to Final Button and Show Draft Toggle */}
                            {(showDraft || schedules.some(s => !s.is_draft)) && currentBatchId && schedules.length > 0 && (
                                <div className="d-flex justify-content-between align-items-center mt-3"> {/* Bootstrap flex classes */}
                                     {/* Show Draft Toggle (using simple checkbox + label) */}
                                    <div className="form-check form-switch"> {/* Bootstrap switch classes */}
                                        <input 
                                            className="form-check-input"
                                            type="checkbox"
                                            id="showDraftSwitch"
                                            checked={showDraft}
                                            onChange={(e) => setShowDraft(e.target.checked)}
                                        />
                                        <label className="form-check-label" htmlFor="showDraftSwitch">Show Draft</label>
                                    </div>
                                </div>
                            )}
                         </div>
                    )}

                     {/* No Schedules Message */}
                    {!loading && schedules.length === 0 && currentBatchId && (
                         <div className="alert alert-info" role="alert">
                            No schedules found for this batch.
                         </div>
                    )}

                    {/* Modal */}
                    {showModal && (
                        <>
                            <div className="modal-backdrop fade show"></div>
                            <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                                <div className="modal-dialog modal-lg">
                                    <div className="modal-content">
                                        <div className="modal-header">
                                            <h5 className="modal-title">{modalTitle}</h5>
                                            <button
                                                type="button"
                                                className="btn-close"
                                                onClick={() => setShowModal(false)}
                                                aria-label="Close"
                                            ></button>
                                        </div>
                                        <div className="modal-body">
                                            {renderModalContent()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
};

export default LiveSchedule; 