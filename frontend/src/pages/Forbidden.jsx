import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Home } from 'lucide-react';

export default function Forbidden() {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  const handleGoHome = () => {
    if (userRole === 'mentor') {
      navigate('/dashboard');
    } else if (userRole === 'student') {
      navigate('/me/attendance');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-void">
      <div className="card max-w-md w-full p-8 text-center flex flex-col items-center border border-border-subtle bg-surface shadow-card rounded-2xl">
        <div className="h-16 w-16 bg-danger-bg rounded-full flex items-center justify-center mb-6">
          <AlertTriangle className="h-8 w-8 text-danger" />
        </div>
        
        <h1 className="text-display-sm text-primary mb-2">Access Denied</h1>
        <p className="text-body-lg text-secondary mb-8">
          You don't have permission to view this page. If you believe this is an error, please contact an administrator.
        </p>

        <button 
          onClick={handleGoHome}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          <Home className="h-4 w-4" />
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
