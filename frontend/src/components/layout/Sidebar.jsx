import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  BookOpen,
  Upload,
  UserCheck,
  Calendar,
  Settings,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function Sidebar() {
  const { userRole, userProfile } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItemClass = ({ isActive }) => {
    return `flex items-center gap-3 px-4 h-11 rounded-lg transition-colors text-body ${
      isActive 
        ? 'bg-surface-raised text-primary border-l-2 border-l-accent-glow' 
        : 'text-secondary hover:bg-surface hover:text-primary'
    }`;
  };

  const NavGroup = ({ label, children }) => (
    <div className="mb-6">
      <div className="text-label text-tertiary mb-3 px-4">{label}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );

  return (
    <div className="w-[260px] h-screen bg-canvas border-r border-border-subtle flex flex-col hidden md:flex flex-shrink-0">
      {/* Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-border-subtle shrink-0">
        <div className="text-h2 font-display font-bold text-primary tracking-tight">ForgeTrack</div>
        <button className="text-tertiary hover:text-secondary">
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Welcome Block */}
      <div className="p-6 border-b border-border-subtle shrink-0">
        <div className="text-body font-medium text-primary mb-1">
          Welcome Back, {userProfile?.display_name?.split(' ')[0] || 'User'}
        </div>
        <div className="text-caption text-tertiary">
          Role: {userRole?.charAt(0).toUpperCase() + userRole?.slice(1) || 'Unknown'}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-3">
        {userRole === 'mentor' && (
          <>
            <NavGroup label="OVERVIEW">
              <NavLink to="/dashboard" className={navItemClass}>
                <LayoutDashboard className="h-5 w-5 stroke-[1.75px]" />
                Dashboard
              </NavLink>
            </NavGroup>

            <NavGroup label="ACTIVITY">
              <NavLink to="/attendance" className={navItemClass}>
                <CheckSquare className="h-5 w-5 stroke-[1.75px]" />
                Mark Attendance
              </NavLink>
              <NavLink to="/history" className={navItemClass}>
                <Users className="h-5 w-5 stroke-[1.75px]" />
                Student History
              </NavLink>
              <NavLink to="/materials" className={navItemClass}>
                <BookOpen className="h-5 w-5 stroke-[1.75px]" />
                Materials
              </NavLink>
            </NavGroup>

            <NavGroup label="DATA">
              <NavLink to="/upload" className={navItemClass}>
                <Upload className="h-5 w-5 stroke-[1.75px]" />
                Upload CSV
              </NavLink>
            </NavGroup>
          </>
        )}

        {userRole === 'student' && (
          <>
            <NavGroup label="OVERVIEW">
              <NavLink to="/me/attendance" className={navItemClass}>
                <UserCheck className="h-5 w-5 stroke-[1.75px]" />
                My Attendance
              </NavLink>
              <NavLink to="/me/upcoming" className={navItemClass}>
                <Calendar className="h-5 w-5 stroke-[1.75px]" />
                Upcoming
              </NavLink>
              <NavLink to="/me/materials" className={navItemClass}>
                <BookOpen className="h-5 w-5 stroke-[1.75px]" />
                Materials
              </NavLink>
            </NavGroup>
          </>
        )}

        <NavGroup label="ACCOUNT">
          <button className="w-full flex items-center gap-3 px-4 h-11 rounded-lg transition-colors text-body text-secondary hover:bg-surface hover:text-primary">
            <Settings className="h-5 w-5 stroke-[1.75px]" />
            Settings
          </button>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 h-11 rounded-lg transition-colors text-body text-danger hover:bg-danger-bg hover:text-danger border-l-2 border-transparent hover:border-danger"
          >
            <LogOut className="h-5 w-5 stroke-[1.75px]" />
            Logout
          </button>
        </NavGroup>
      </div>
    </div>
  );
}
