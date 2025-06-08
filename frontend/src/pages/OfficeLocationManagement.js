import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import LocationMap from '../components/LocationMap';
import NavigationBar from '../components/NavigationBar';
import Sidebar from '../components/Sidebar';
import '../styles/OfficeLocationManagement.css';
import '../styles/Dashboard.css';

const OfficeLocationManagement = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: '100'  // Default radius 100 meters
  });
  const [showSidebar, setShowSidebar] = useState(false);

  const token = useSelector(state => state.auth.token);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/office-locations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLocations(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch office locations');
      setLoading(false);
    }
  };

  const handleAddLocation = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/office-locations', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowAddModal(false);
      setFormData({ name: '', address: '', latitude: '', longitude: '', radius: '100' });
      fetchLocations();
    } catch (err) {
      setError('Failed to add office location');
    }
  };

  const handleEditLocation = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/office-locations/${selectedLocation.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowEditModal(false);
      setFormData({ name: '', address: '', latitude: '', longitude: '', radius: '100' });
      fetchLocations();
    } catch (err) {
      setError('Failed to update office location');
    }
  };

  const handleDeleteLocation = async (id) => {
    if (window.confirm('Are you sure you want to delete this office location?')) {
      try {
        await axios.delete(`http://localhost:5000/api/office-locations/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchLocations();
      } catch (err) {
        setError('Failed to delete office location');
      }
    }
  };

  const showLocationOnMap = (location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      radius: location.radius
    });
    setShowMapModal(true);
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
              <h1>Office Location Management</h1>
              <button className="btn btn-primary" onClick={() => {
                console.log('Add Location button clicked');
                setShowAddModal(true);
              }}>
                Add Location
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            <table className="location-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Address</th>
                  <th>Latitude</th>
                  <th>Longitude</th>
                  <th>Radius (m)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {locations.map(location => (
                  <tr key={location.id}>
                    <td>{location.name}</td>
                    <td>{location.address}</td>
                    <td>{location.latitude}</td>
                    <td>{location.longitude}</td>
                    <td>{location.radius}</td>
                    <td>
                      <button
                        className="btn btn-view"
                        onClick={() => {
                          console.log('View Map button clicked for location:', location.id);
                          showLocationOnMap(location);
                        }}
                      >
                        View Map
                      </button>
                      <button
                        className="btn btn-edit"
                        onClick={() => {
                          console.log('Edit button clicked for location:', location.id);
                          setSelectedLocation(location);
                          setFormData({
                            name: location.name,
                            address: location.address,
                            latitude: location.latitude,
                            longitude: location.longitude,
                            radius: location.radius
                          });
                          setShowEditModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-delete"
                        onClick={() => handleDeleteLocation(location.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Add Location Modal */}
            {showAddModal && (
              <div className="modal" style={{
                display: showAddModal ? 'flex' : 'none',
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
                  <h2>Add Office Location</h2>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowAddModal(false)}></button>
                  <form onSubmit={handleAddLocation}>
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Location Map</label>
                      <LocationMap formData={formData} setFormData={setFormData} />
                    </div>

                    <div className="form-row">
                      <div className="form-group half">
                        <label>Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group half">
                        <label>Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Radius (meters)</label>
                      <input
                        type="number"
                        value={formData.radius}
                        onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                        required
                      />
                    </div>
                    <div className="modal-actions">
                      <button type="submit" className="btn btn-primary">Add</button>
                      <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Edit Location Modal */}
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
                  <h2>Edit Office Location</h2>
                  <form onSubmit={handleEditLocation}>
                    <div className="form-group">
                      <label>Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Location Map</label>
                      <LocationMap formData={formData} setFormData={setFormData} />
                    </div>

                    <div className="form-row">
                      <div className="form-group half">
                        <label>Latitude</label>
                        <input
                          type="number"
                          step="any"
                          value={formData.latitude}
                          onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group half">
                        <label>Longitude</label>
                        <input
                          type="number"
                          step="any"
                          value={formData.longitude}
                          onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Radius (meters)</label>
                      <input
                        type="number"
                        value={formData.radius}
                        onChange={(e) => setFormData({ ...formData, radius: e.target.value })}
                        required
                      />
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

            {/* Map Modal */}
            {showMapModal && (
              <div className="modal" style={{
                display: showMapModal ? 'flex' : 'none',
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
                  <h2>Location Map</h2>
                  <LocationMap formData={formData} setFormData={setFormData} isViewOnly={true} />
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowMapModal(false)}
                    >
                      Close
                    </button>
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

export default OfficeLocationManagement; 