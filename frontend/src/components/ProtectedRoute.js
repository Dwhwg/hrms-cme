import React, { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const ProtectedRoute = ({ children, allowedRoles = ['PIC', 'employee'] }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    } else if (!loading && user && !allowedRoles.includes(user.role)) {
      if (user.role === 'PIC') {
        navigate('/dashboard');
      } else if (user.role === 'employee') {
        navigate('/attendance');
      }
    }
  }, [isAuthenticated, user, navigate, allowedRoles, loading]);

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role)) {
    if (user.role === 'PIC') {
      return <Navigate to="/dashboard" replace />;
    } else if (user.role === 'employee') {
      return <Navigate to="/attendance" replace />;
    }
  }

  return children;
};

export default ProtectedRoute; 