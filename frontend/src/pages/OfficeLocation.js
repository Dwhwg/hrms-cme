import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import '../styles/OfficeLocation.css';

const OfficeLocation = () => {
  const [locations, setLocations] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radius: ''
  });

  const user = useSelector(state => state.auth.user);

  useEffect(() => {
    // TODO: Fetch locations from API
    // This is a mock data for now
    setLocations([
      { 
        id: 1, 
        name: 'Main Office', 
        address: 'Jl. Sudirman No. 123', 
        latitude: -6.2088, 
        longitude: 106.8456,
        radius: 100
      }
    ]);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Add location to API
    console.log('Form submitted:', formData);
    setShowAddModal(false);
    setFormData({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      radius: ''
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="office-location">
      <div className="header">
        <h2>Office Location Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          Add Location
        </button>
      </div>

      <div className="location-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Coordinates</th>
              <th>Radius (m)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {locations.map(location => (
              <tr key={location.id}>
                <td>{location.name}</td>
                <td>{location.address}</td>
                <td>{location.latitude}, {location.longitude}</td>
                <td>{location.radius}</td>
                <td>
                  <button className="btn btn-edit">Edit</button>
                  <button className="btn btn-delete">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add New Office Location</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Latitude</label>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  value={formData.latitude}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Longitude</label>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  value={formData.longitude}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Radius (meters)</label>
                <input
                  type="number"
                  name="radius"
                  value={formData.radius}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficeLocation; 