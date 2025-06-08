import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../store/slices/authSlice';
import '../styles/LoginPage.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    remember: false
  });
  const [error, setError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        dispatch(login(data));
        navigate('/');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred during login');
    }
  };

  return (
    <div className="container">
      <div className="login-container">
        <div className="logo">
          <h2><span style={{ color: '#3498db' }}>HRMS</span> CME</h2>
          <p className="text-muted">Human Resource Management System</p>
        </div>

        <div className="card login-card">
          <div className="card-header login-header py-3">
            <h4 className="mb-0 text-center">Login to Your Account</h4>
          </div>
          <div className="card-body p-4">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Username</label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="username" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Enter your username" 
                  required 
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label">Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  id="password" 
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password" 
                  required 
                />
              </div>
              <div className="mb-3 form-check">
                <input 
                  type="checkbox" 
                  className="form-check-input" 
                  id="remember"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="remember">Remember me</label>
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2">Login</button>
            </form>
            <div className="text-center mt-3">
              <a href="#" className="text-decoration-none">Forgot password?</a>
            </div>
            <hr className="my-4" />
            <div className="text-center">
              <p className="text-muted mb-0">Don't have an account? Contact HR Department</p>
            </div>
          </div>
        </div>
        <div className="text-center mt-3">
          <p className="text-muted small">&copy; {new Date().getFullYear()} HRMS CME. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 