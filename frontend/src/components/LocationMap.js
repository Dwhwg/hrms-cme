import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import '../styles/LocationMap.css';

// 修复Leaflet默认图标问题
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// 地图控制器组件，用于更新地图视图
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

// 地图上的标记组件
const LocationMarker = ({ position, setPosition, radius, isViewOnly }) => {
  const map = useMapEvents({
    click: (e) => {
      if (!isViewOnly) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      }
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position ? (
    <>
      <Marker position={position} />
      {radius && radius > 0 && (
        <Circle
          center={position}
          radius={radius}
          pathOptions={{ fillColor: 'blue', fillOpacity: 0.2, color: 'blue' }}
        />
      )}
    </>
  ) : null;
};

const LocationMap = ({ formData, setFormData, isViewOnly = false }) => {
  const mapRef = useRef(null);
  const [position, setPosition] = useState(null);
  const [searchAddress, setSearchAddress] = useState('');
  
  // Default position (if not set)
  const defaultPosition = [-6.2088, 106.8456]; // Jakarta, Indonesia
  const zoom = isViewOnly ? 16 : 15;
  
  // Initialize position
  useEffect(() => {
    if (formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setPosition([lat, lng]);
      }
    }
  }, [formData.latitude, formData.longitude]);

  // Handle position change
  const handlePositionChange = (newPosition, accuracy = null) => {
    setPosition(newPosition);
    
    if (!isViewOnly && setFormData) {
      // Also update latitude and longitude and accuracy (if any)
      const updatedData = {
        ...formData,
        latitude: newPosition[0],
        longitude: newPosition[1]
      };
      
      // Save accuracy if provided
      if (accuracy !== null) {
        updatedData.accuracy = accuracy;
      }
      
      setFormData(updatedData);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      // Show loading status
      alert('Getting your location, please wait...');
      
      const geoOptions = {
        enableHighAccuracy: true, // Request high accuracy
        timeout: 10000,           // 10 seconds timeout
        maximumAge: 0             // Do not use cached location
      };
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Clear loading status
          
          // Check accuracy
          const accuracy = position.coords.accuracy; // Accuracy in meters
          
          if (accuracy > 100) {
            // If accuracy is over 100 meters, warn user but still use the location
            alert(`Warning: Location accuracy is low (${Math.round(accuracy)} meters). This may affect attendance accuracy. Please consider moving to an open area or try again.`);
          }
          
          const newPosition = [position.coords.latitude, position.coords.longitude];
          console.log(`Location obtained: ${newPosition[0]}, ${newPosition[1]}, accuracy: ${accuracy} meters`);
          handlePositionChange(newPosition, accuracy);
        },
        (error) => {
          console.error('Error getting location:', error);
          
          // Show different messages based on error type
          let errorMessage = '';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'You denied the location request. Please allow location access in your browser settings.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable. Please make sure your device GPS is on and try again in an open area.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Getting location timed out. Please check your network connection and try again.';
              break;
            default:
              errorMessage = `Unable to get your location: ${error.message}`;
          }
          
          alert(errorMessage);
        },
        geoOptions
      );
    } else {
      alert('Your browser does not support geolocation. Please try another browser.');
    }
  };

  // Address search feature
  const searchLocation = async () => {
    if (!searchAddress.trim()) return;
    
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchAddress)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const newPosition = [parseFloat(result.lat), parseFloat(result.lon)];
        handlePositionChange(newPosition);
      } else {
        alert('Location not found. Please try a different search term.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      alert('Failed to search location.');
    }
  };

  return (
    <div className={`location-map ${isViewOnly ? 'view-only' : ''}`}>
      {!isViewOnly && (
        <div className="map-search-control">
          <input
            type="text"
            placeholder="Search by address"
            value={searchAddress}
            onChange={(e) => setSearchAddress(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
          />
          <div className="map-search-buttons">
            <button type="button" onClick={searchLocation}>Search</button>
            <button type="button" onClick={getCurrentLocation}>Get Current Location</button>
          </div>
        </div>
      )}
      
      <MapContainer
        center={position || defaultPosition}
        zoom={zoom}
        style={{ height: isViewOnly ? '300px' : '400px', width: '100%' }}
        ref={mapRef}
        zoomControl={!isViewOnly}
        dragging={!isViewOnly}
        scrollWheelZoom={!isViewOnly}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker 
          position={position} 
          setPosition={handlePositionChange} 
          radius={formData.radius ? parseInt(formData.radius) : 100} 
          isViewOnly={isViewOnly}
        />
        <MapController 
          center={position} 
          zoom={zoom} 
        />
      </MapContainer>
      {!isViewOnly && (
        <div className="map-instructions">
          <p>Click the map to select a location, or use the search bar and buttons above.</p>
        </div>
      )}
    </div>
  );
};

export default LocationMap; 