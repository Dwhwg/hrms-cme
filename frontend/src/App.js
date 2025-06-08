import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store';
import AuthCheck from './components/AuthCheck';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import OfficeLocationManagement from './pages/OfficeLocationManagement';
import AttendancePage from './pages/AttendancePage';
import AttendanceHistoryPage from './pages/AttendanceHistoryPage';
import LiveStreamManagementPage from './pages/LiveStreamManagementPage';
import WorkSchedulePage from './pages/WorkSchedulePage';
import ApprovalPage from './pages/ApprovalPage';
import LiveSchedule from './pages/LiveSchedule';
import LiveAccountsManagementPage from './pages/LiveAccountsManagementPage';
import HostManagementPage from './pages/HostManagementPage';
import HostAvailabilityManagementPage from './pages/HostAvailabilityManagementPage';
import HostAccountAssignmentPage from './pages/HostAccountAssignmentPage';
import 'leaflet/dist/leaflet.css';
import './styles/App.css';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AuthCheck>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['PIC', 'employee']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/employees" 
              element={
                <ProtectedRoute allowedRoles={['PIC']}>
                  <EmployeeManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/office-locations" 
              element={
                <ProtectedRoute allowedRoles={['PIC']}>
                  <OfficeLocationManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/attendance" 
              element={
                <ProtectedRoute allowedRoles={['PIC', 'employee']}>
                  <AttendancePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/attendance-history" 
              element={
                <ProtectedRoute allowedRoles={['PIC', 'employee']}>
                  <AttendanceHistoryPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/live-streams" 
              element={
                <ProtectedRoute allowedRoles={['PIC']}>
                  <LiveStreamManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/live-accounts"
              element={
                <ProtectedRoute allowedRoles={['PIC']}>
                  <LiveAccountsManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/work-schedules" 
              element={
                <ProtectedRoute allowedRoles={['PIC']}>
                  <WorkSchedulePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/live-schedule" 
              element={
                <ProtectedRoute allowedRoles={['PIC']}>
                  <LiveSchedule />
                </ProtectedRoute>
              } 
            />
            <Route path="/approvals" element={<ProtectedRoute allowedRoles={['PIC']}><ApprovalPage /></ProtectedRoute>} />
            <Route 
              path="/host-management" 
              element={
                <ProtectedRoute allowedRoles={['PIC']}>
                  <HostManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/host-availability" 
              element={
                <ProtectedRoute allowedRoles={['PIC']}>
                  <HostAvailabilityManagementPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/host-account-assignment"
              element={
                <ProtectedRoute allowedRoles={['PIC']}>
                  <HostAccountAssignmentPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AuthCheck>
      </Router>
    </Provider>
  );
}

export default App;
