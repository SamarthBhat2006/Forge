import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Layout & Guards
import MainLayout from './components/layout/MainLayout';
import RoleGuard from './components/layout/RoleGuard';

// Pages
import Login from './pages/Login';
import Forbidden from './pages/Forbidden';
import DevTokens from './pages/DevTokens';

// Mentor Pages
import Dashboard from './pages/mentor/Dashboard';
import MarkAttendance from './pages/mentor/MarkAttendance';
import StudentHistory from './pages/mentor/StudentHistory';
import Materials from './pages/mentor/Materials';
import BulkUpload from './pages/mentor/BulkUpload';

// Simple Index Route to redirect based on role
function IndexRedirect() {
  const { session, userRole, loading } = useAuth();
  
  if (loading) return null;
  
  if (!session) return <Navigate to="/login" replace />;
  
  if (userRole === 'mentor') return <Navigate to="/dashboard" replace />;
  if (userRole === 'student') return <Navigate to="/me/attendance" replace />;
  
  return <Navigate to="/403" replace />;
}

// Dummy placeholder for unbuilt student pages
const Placeholder = ({ title }) => (
  <div className="flex flex-col gap-4">
    <h1 className="text-h1 text-primary">{title}</h1>
    <p className="text-body text-secondary">This page is under construction (Phase 5).</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/403" element={<Forbidden />} />
          <Route path="/dev-tokens" element={<DevTokens />} />

          {/* Root Redirect */}
          <Route path="/" element={<IndexRedirect />} />

          {/* Protected App Routes inside Shell */}
          <Route element={<MainLayout />}>
            
            {/* Mentor Routes */}
            <Route 
              path="/dashboard" 
              element={
                <RoleGuard allowedRoles={['mentor']}>
                  <Dashboard />
                </RoleGuard>
              } 
            />
            <Route 
              path="/attendance" 
              element={
                <RoleGuard allowedRoles={['mentor']}>
                  <MarkAttendance />
                </RoleGuard>
              } 
            />
            <Route 
              path="/history" 
              element={
                <RoleGuard allowedRoles={['mentor']}>
                  <StudentHistory />
                </RoleGuard>
              } 
            />
            <Route 
              path="/materials" 
              element={
                <RoleGuard allowedRoles={['mentor']}>
                  <Materials />
                </RoleGuard>
              } 
            />
            <Route 
              path="/upload" 
              element={
                <RoleGuard allowedRoles={['mentor']}>
                  <BulkUpload />
                </RoleGuard>
              } 
            />

            {/* Student Routes */}
            <Route 
              path="/me/attendance" 
              element={
                <RoleGuard allowedRoles={['student']}>
                  <Placeholder title="My Attendance" />
                </RoleGuard>
              } 
            />
            <Route 
              path="/me/upcoming" 
              element={
                <RoleGuard allowedRoles={['student']}>
                  <Placeholder title="Upcoming Sessions" />
                </RoleGuard>
              } 
            />
            <Route 
              path="/me/materials" 
              element={
                <RoleGuard allowedRoles={['student']}>
                  <Placeholder title="Materials" />
                </RoleGuard>
              } 
            />
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
