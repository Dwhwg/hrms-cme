import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser, setLoading, logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

const AuthCheck = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, loading } = useSelector(state => state.auth);

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        dispatch(setLoading(false));
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          dispatch(setUser(data));
        } else {
          dispatch(logout());
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        dispatch(logout());
        navigate('/login');
      }
      dispatch(setLoading(false));
    };

    checkAuth();
  }, [dispatch, token, navigate]);

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>;
  }

  return children;
};

export default AuthCheck; 