import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import LocationMap from '../components/LocationMap';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../components/Sidebar';
import '../styles/AttendancePage.css';
import '../styles/Dashboard.css';

// Helper function: safely parse coordinates
const safeParseFloat = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

// Helper function: format coordinates
const formatCoordinate = (value) => {
  const parsed = safeParseFloat(value);
  return parsed !== null ? parsed.toFixed(6) : 'N/A';
};

const AttendancePage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [location, setLocation] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [viewingRecord, setViewingRecord] = useState(null);
  const [viewingPhoto, setViewingPhoto] = useState(null);
  const [employeeId, setEmployeeId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const { token, user } = useSelector(state => state.auth);
  const isPIC = user?.role === 'PIC';
  
  // Get employee ID
  useEffect(() => {
    if (user && user.id) {
      if (user.employeeId) {
        setEmployeeId(user.employeeId);
        fetchAttendanceHistory(user.employeeId);
      } else {
        fetchEmployeeId();
      }
    }
  }, [user]);

  const fetchEmployeeId = async () => {
    try {
      console.log('Fetching employee ID for user:', user.id);
      // Try to get or create employee record
      const response = await axios.get(`http://localhost:5000/api/employees/user/${user.id}/getOrCreate`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        console.log('Employee data received:', response.data);
        const newEmployeeId = response.data.id;
        setEmployeeId(newEmployeeId);
        fetchAttendanceHistory(newEmployeeId);
      } else {
        setError('Employee record not found. Please contact administrator.');
      }
    } catch (error) {
      console.error('Error fetching employee ID:', error);
      setError('Failed to fetch employee information: ' + (error.response?.data?.error || error.message));
    }
  };
  
  // Clean up camera resources
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // When camera open state changes, ensure video element displays correctly
  useEffect(() => {
    if (showCamera && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [showCamera]);

  const fetchAttendanceHistory = async (empId = null, month = null) => {
    const currentEmployeeId = empId || employeeId;
    if (!currentEmployeeId) return;
    try {
      setLoading(true);
      let url = `http://localhost:5000/api/attendances/history/${currentEmployeeId}`;
      // If month specified, add query param
      if (month) {
        const currentYear = new Date().getFullYear();
        url += `?month=${month}&year=${currentYear}`;
      }
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Preprocess data, ensure coordinates are valid numbers
      const processedData = response.data.map(record => ({
        ...record,
        latitude: safeParseFloat(record.latitude),
        longitude: safeParseFloat(record.longitude)
      }));
      setAttendanceHistory(processedData);
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      setError('Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  };

  // Location is now managed by LocationMap component
  const getLocation = () => {
    // This function is kept for compatibility, but actual location is managed by LocationMap component
    console.log('Location is now managed by the LocationMap component');
  };

  const startCamera = async () => {
    setCameraLoading(true);
    setError('');
    try {
      // Check if browser supports media devices
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access');
      }
      // Stop previous camera stream
      stopCamera();
      console.log('Requesting camera access...');
      // Try to request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false 
      });
      console.log('Camera access granted');
      // Save stream reference
      streamRef.current = stream;
      setShowCamera(true);
      // Delay to ensure DOM is updated
      setTimeout(() => {
        // Set video element source
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('Video element found, stream attached');
        } else {
          console.error('Video element reference is still null after delay');
          setError('Camera initialization failed: Video element not found after DOM update');
        }
        setCameraLoading(false);
      }, 100);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError(`Failed to access camera: ${err.message}. Please allow camera access.`);
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      console.log('Stopping camera...');
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Track stopped:', track.kind);
      });
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not initialized properly');
      return;
    }
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      // Set canvas size same as video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      // Add timestamp
      const now = new Date();
      const timestamp = now.toLocaleString();
      context.font = '16px Arial';
      context.fillStyle = 'white';
      context.strokeStyle = 'black';
      context.lineWidth = 0.5;
      context.fillText(timestamp, 10, 30);
      context.strokeText(timestamp, 10, 30);
      // Convert canvas to Blob
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
          setPhoto(file);
          setPhotoUrl(URL.createObjectURL(blob));
          stopCamera();
        } else {
          setError('Failed to capture photo');
        }
      }, 'image/jpeg');
    } catch (err) {
      console.error('Error capturing photo:', err);
      setError('Failed to capture photo: ' + err.message);
    }
  };

  const handleClockIn = async () => {
    if (!location) {
      setError('Please get your location first');
      return;
    }
    // Check if location data is complete
    if (!location.latitude || !location.longitude) {
      setError('Location data is incomplete, please get your location again');
      return;
    }
    // Check location accuracy (if available)
    if (location.accuracy && location.accuracy > 200) {
      if (!window.confirm(`Warning: Location accuracy is low (${Math.round(location.accuracy)} meters). This may cause attendance failure. Continue anyway?`)) {
        return;
      }
    }
    if (!photo) {
      setError('Please take a photo for attendance verification');
      return;
    }
    // Check if employeeId exists
    if (!employeeId && !user?.employeeId) {
      setError('Employee ID not found, please try again later');
      return;
    }
    try {
      setLoading(true);
      setError('');
      // Ensure coordinates are numbers
      const safeLatitude = safeParseFloat(location.latitude);
      const safeLongitude = safeParseFloat(location.longitude);
      if (safeLatitude === null || safeLongitude === null) {
        throw new Error('Invalid location coordinates, please get your location again');
      }
      // Create form data
      const formData = new FormData();
      formData.append('employeeId', employeeId || user.employeeId);
      formData.append('latitude', safeLatitude);
      formData.append('longitude', safeLongitude);
      // Add accuracy if available
      if (location.accuracy) {
        formData.append('accuracy', location.accuracy);
      }
      // Add photo
      if (photo instanceof File) {
        formData.append('photo', photo, 'attendance.jpg');
      } else {
        const photoBlob = await fetch(photo).then(r => r.blob());
        formData.append('photo', photoBlob, 'attendance.jpg');
      }
      // Send request
      const response = await axios.post(
        'http://localhost:5000/api/attendances/clock-in',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      if (response.data) {
        setSuccess('Clock in successful!');
        setPhoto(null);
        fetchAttendanceHistory();
      }
    } catch (error) {
      console.error('Clock in error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setError(`Clock in failed: ${errorMessage}`);
      // If error is location related, inform user
      if (errorMessage && errorMessage.toLowerCase().includes('location')) {
        setError(`Clock in failed: ${errorMessage}. Please make sure you are in the office area and have good GPS signal.`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleClockOut = async () => {
    if (!location) {
      setError('Please get your location first');
      return;
    }
    // Check if location data is complete
    if (!location.latitude || !location.longitude) {
      setError('Location data is incomplete, please get your location again');
      return;
    }
    // Check location accuracy (if available)
    if (location.accuracy && location.accuracy > 200) {
      if (!window.confirm(`Warning: Location accuracy is low (${Math.round(location.accuracy)} meters). This may cause attendance failure. Continue anyway?`)) {
        return;
      }
    }
    if (!photo) {
      setError('Please take a photo for attendance verification');
      return;
    }
    // Check if employeeId exists
    if (!employeeId && !user?.employeeId) {
      setError('Employee ID not found, please try again later');
      return;
    }
    try {
      setLoading(true);
      setError('');
      // Ensure coordinates are numbers
      const safeLatitude = safeParseFloat(location.latitude);
      const safeLongitude = safeParseFloat(location.longitude);
      if (safeLatitude === null || safeLongitude === null) {
        throw new Error('Invalid location coordinates, please get your location again');
      }
      // Create form data
      const formData = new FormData();
      formData.append('employeeId', employeeId || user.employeeId);
      formData.append('latitude', safeLatitude);
      formData.append('longitude', safeLongitude);
      // Add accuracy if available
      if (location.accuracy) {
        formData.append('accuracy', location.accuracy);
      }
      // Add photo
      if (photo instanceof File) {
        formData.append('photo', photo, 'attendance.jpg');
      } else {
        const photoBlob = await fetch(photo).then(r => r.blob());
        formData.append('photo', photoBlob, 'attendance.jpg');
      }
      // Send request
      const response = await axios.post(
        'http://localhost:5000/api/attendances/clock-out',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      if (response.data) {
        setSuccess('Clock out successful!');
        setPhoto(null);
        fetchAttendanceHistory();
      }
    } catch (error) {
      console.error('Clock out error:', error);
      const errorMessage = error.response?.data?.message || error.message;
      setError(`Clock out failed: ${errorMessage}`);
      // If error is location related, inform user
      if (errorMessage && errorMessage.toLowerCase().includes('location')) {
        setError(`Clock out failed: ${errorMessage}. Please make sure you are in the office area and have good GPS signal.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <NavigationBar onHamburgerClick={() => setShowSidebar(v => !v)} />
      <Sidebar showSidebar={showSidebar} onCloseSidebar={() => setShowSidebar(false)} />
      <div className="main-content">
        <h1>Attendance</h1>
        
        <div className="attendance-section">
          <div className="camera-section">
            {!showCamera && !photoUrl && (
              <button 
                onClick={startCamera} 
                className="btn btn-primary" 
                disabled={cameraLoading}
              >
                {cameraLoading ? 'Starting Camera...' : 'Open Camera'}
              </button>
            )}
            
            {showCamera && (
              <div className="camera-container">
                <video
                  ref={videoRef}
                  width="100%"
                  height="auto"
                  autoPlay
                  playsInline
                  muted
                  onCanPlay={() => console.log('Video can play now')}
                  className="camera-video"
                />
                <div className="camera-buttons">
                  <button onClick={capturePhoto} className="btn btn-success">
                    Take Photo
                  </button>
                  <button onClick={stopCamera} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {photoUrl && (
              <div className="photo-preview-container">
                <img src={photoUrl} alt="Preview" className="photo-preview" />
                <button 
                  onClick={() => {
                    setPhoto(null);
                    setPhotoUrl('');
                  }}
                  className="btn btn-secondary"
                >
                  Retake Photo
                </button>
              </div>
            )}
          </div>

          <div className="clock-buttons">
            <button
              onClick={handleClockIn}
              disabled={loading || !location || !photo}
              className="btn btn-success"
            >
              Clock In
            </button>
            <button
              onClick={handleClockOut}
              disabled={loading || !location || !photo}
              className="btn btn-danger"
            >
              Clock Out
            </button>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="location-map-container">
          <h2>Location</h2>
          <div className="location-actions">
            <button 
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                      });
                      setError('');
                    },
                    (error) => {
                      console.error('Error getting location:', error);
                      setError('Failed to get your location. Please enable location services.');
                    }
                  );
                } else {
                  setError('Geolocation is not supported by your browser');
                }
              }}
              className="btn btn-primary"
            >
              Get Current Location
            </button>
            {location && (
              <div className="location-info">
                <p>Current Location: {
                  location.latitude && location.longitude ? 
                    `${formatCoordinate(location.latitude)}, ${formatCoordinate(location.longitude)}` : 
                    'N/A'
                }</p>
                {location.accuracy && (
                  <p>Accuracy: {Math.round(location.accuracy)} meters</p>
                )}
              </div>
            )}
          </div>
          
          {location && (
            <LocationMap
              formData={{
                latitude: safeParseFloat(location.latitude) || 0,
                longitude: safeParseFloat(location.longitude) || 0,
                radius: 100 // Default radius in meters
              }}
              isViewOnly={true}
            />
          )}
        </div>

        <div className="attendance-history">
          <h2>Attendance History</h2>
          
          <div className="attendance-filters">
            <select 
              className="filter-select"
              onChange={(e) => {
                const month = parseInt(e.target.value);
                fetchAttendanceHistory(null, month);
              }}
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
            <button 
              className="btn btn-primary btn-refresh" 
              onClick={() => fetchAttendanceHistory()}
            >
              Refresh
            </button>
          </div>
          
          {attendanceHistory.length === 0 ? (
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
                    <th>Type</th>
                    <th>Location</th>
                    <th>Photo</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceHistory.map((record) => (
                    <tr key={record.id} className={record.type === 'IN' ? 'in-record' : 'out-record'}>
                      <td>{new Date(record.created_at).toLocaleDateString()}</td>
                      <td>{new Date(record.created_at).toLocaleTimeString()}</td>
                      <td>
                        <span className={`attendance-type ${record.type === 'IN' ? 'type-in' : 'type-out'}`}>
                          {record.type === 'IN' ? 'Clock In' : 'Clock Out'}
                        </span>
                      </td>
                      <td>
                        <div className="location-display">
                          {record.latitude !== null && record.longitude !== null ? 
                            `${formatCoordinate(record.latitude)}, ${formatCoordinate(record.longitude)}` : 
                            'N/A'}
                          {record.latitude !== null && record.longitude !== null && (
                            <button 
                              className="btn-map-mini"
                              onClick={() => {
                                // 在模态框中显示地图位置
                                setViewingRecord(record);
                              }}
                            >
                              Map
                            </button>
                          )}
                        </div>
                      </td>
                      <td>
                        {record.photo_url && (
                          <img
                            src={`http://localhost:5000${record.photo_url}`}
                            alt="Attendance"
                            className="attendance-photo"
                            onClick={() => {
                              setViewingPhoto(`http://localhost:5000${record.photo_url}`);
                            }}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* 照片查看模态框 */}
          {viewingPhoto && (
            <div className="modal-backdrop" onClick={() => setViewingPhoto(null)}>
              <div className="photo-modal" onClick={(e) => e.stopPropagation()}>
                <img src={viewingPhoto} alt="Attendance" />
                <button className="btn btn-secondary close-btn" onClick={() => setViewingPhoto(null)}>Close</button>
              </div>
            </div>
          )}
          
          {/* 地图查看模态框 */}
          {viewingRecord && (
            <div className="modal-backdrop" onClick={() => setViewingRecord(null)}>
              <div className="map-modal" onClick={(e) => e.stopPropagation()}>
                <h3>
                  {viewingRecord.type === 'IN' ? 'Clock In' : 'Clock Out'} Location
                  <small>{new Date(viewingRecord.created_at).toLocaleString()}</small>
                </h3>
                <LocationMap
                  formData={{
                    latitude: safeParseFloat(viewingRecord.latitude) || 0,
                    longitude: safeParseFloat(viewingRecord.longitude) || 0,
                    radius: 100
                  }}
                  isViewOnly={true}
                />
                <button className="btn btn-secondary close-btn" onClick={() => setViewingRecord(null)}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;